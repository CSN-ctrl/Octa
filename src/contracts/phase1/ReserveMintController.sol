// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";

interface IXBGLMintable is IERC20Metadata {
    function mint(address to, uint256 amount) external;
}

/**
 * @title ReserveMintController
 * @notice Multisig-operated Phase 1 minting engine for reserve-backed xBGL expansion.
 * @dev Implements spec expansion rule ΔS = ΔR / k with cooldown, evidence hashes, and per-cycle caps.
 *      Reserve valuation and oracle aggregation are off-chain in Phase 1; on-chain enforces issuance rules.
 *      See docs/xbgl-protocol-spec.md.
 */
contract ReserveMintController is AccessControl, Pausable {
    bytes32 public constant RESERVE_REPORTER_ROLE = keccak256("RESERVE_REPORTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant BPS = 10_000;
    /// @dev Issuance reference: 1 EUR = 1.955833 xBGL (not a market peg).
    uint256 public constant EUR_TO_XBGL_E18 = 1_955_833_000_000_000_000;
    uint256 public constant DEFAULT_RESERVE_SHARE_BPS = 3_000;
    /// @dev Recommended k range per spec: 2.0–3.0 (18-decimal fixed point).
    uint256 public constant MIN_RESERVE_MULTIPLIER_E18 = 2 ether;
    uint256 public constant MAX_RESERVE_MULTIPLIER_E18 = 3 ether;

    IXBGLMintable public immutable xbgl;

    uint256 public reserveShareBps;
    uint256 public cooldownSeconds;
    /// @dev Reserve multiplier k (e.g. 2e18 = 2.0). Expansion: ΔS = ΔR / k.
    uint256 public reserveMultiplierE18;
    /// @dev Maximum xBGL minted per expansion cycle (risk control).
    uint256 public maxExpansionPerCycle;

    uint256 public lastExpansionAt;
    uint256 public totalIncomeReportedEurE18;
    uint256 public totalReserveAllocatedEurE18;
    uint256 public totalReserveGrowthUsdE18;
    uint256 public totalExpansionMinted;
    mapping(bytes32 => bool) public usedEvidenceHash;

    event ReservePolicyUpdated(
        uint256 reserveShareBps, uint256 cooldownSeconds, uint256 reserveMultiplierE18, uint256 maxExpansionPerCycle
    );
    event ReserveExpansionMinted(
        address indexed recipient,
        uint256 amount,
        uint256 reserveDeltaUsdE18,
        bytes32 indexed evidenceHash,
        address indexed operator,
        string expansionKind
    );

    constructor(
        address admin,
        address xbglToken,
        uint256 initialReserveShareBps,
        uint256 initialCooldownSeconds,
        uint256 initialReserveMultiplierE18,
        uint256 initialMaxExpansionPerCycle
    ) {
        require(admin != address(0), "admin=0");
        require(xbglToken != address(0), "xbgl=0");
        _validatePolicy(initialReserveShareBps, initialCooldownSeconds, initialReserveMultiplierE18);
        require(initialMaxExpansionPerCycle > 0, "cap=0");

        xbgl = IXBGLMintable(xbglToken);
        reserveShareBps = initialReserveShareBps;
        cooldownSeconds = initialCooldownSeconds;
        reserveMultiplierE18 = initialReserveMultiplierE18;
        maxExpansionPerCycle = initialMaxExpansionPerCycle;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESERVE_REPORTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        emit ReservePolicyUpdated(
            initialReserveShareBps, initialCooldownSeconds, initialReserveMultiplierE18, initialMaxExpansionPerCycle
        );
    }

    /// @notice ΔS = ΔR / k per protocol spec.
    function quoteExpansionFromReserveDelta(uint256 reserveDeltaUsdE18) public view returns (uint256) {
        require(reserveMultiplierE18 > 0, "k=0");
        return (reserveDeltaUsdE18 * 1 ether) / reserveMultiplierE18;
    }

    function quoteReserveAllocation(uint256 incomeEurE18) public view returns (uint256) {
        return (incomeEurE18 * reserveShareBps) / BPS;
    }

    function quoteExpansionMint(uint256 incomeEurE18) public view returns (uint256) {
        return (quoteReserveAllocation(incomeEurE18) * EUR_TO_XBGL_E18) / 1 ether;
    }

    /**
     * @notice Mint from verified reserve growth (primary spec path): ΔS = ΔR / k.
     * @param reserveDeltaUsdE18 Verified increase in reserve USD value (18 decimals).
     */
    function mintFromReserveGrowth(address recipient, uint256 reserveDeltaUsdE18, bytes32 evidenceHash)
        external
        onlyRole(RESERVE_REPORTER_ROLE)
        whenNotPaused
        returns (uint256 mintedAmount)
    {
        require(reserveDeltaUsdE18 > 0, "delta=0");
        mintedAmount = quoteExpansionFromReserveDelta(reserveDeltaUsdE18);
        _executeExpansion(recipient, mintedAmount, reserveDeltaUsdE18, evidenceHash, "reserve_growth");
        totalReserveGrowthUsdE18 += reserveDeltaUsdE18;
    }

    /**
     * @notice Phase 1 income-report path: verified EUR income → reserve share → xBGL issuance reference.
     */
    function mintFromIncome(address recipient, uint256 incomeEurE18, bytes32 evidenceHash)
        external
        onlyRole(RESERVE_REPORTER_ROLE)
        whenNotPaused
        returns (uint256 mintedAmount)
    {
        require(incomeEurE18 > 0, "income=0");
        uint256 reserveAllocatedEurE18 = quoteReserveAllocation(incomeEurE18);
        require(reserveAllocatedEurE18 > 0, "reserve=0");
        mintedAmount = quoteExpansionMint(incomeEurE18);
        _executeExpansion(recipient, mintedAmount, reserveAllocatedEurE18, evidenceHash, "income_report");
        totalIncomeReportedEurE18 += incomeEurE18;
        totalReserveAllocatedEurE18 += reserveAllocatedEurE18;
    }

    function setReservePolicy(
        uint256 newReserveShareBps,
        uint256 newCooldownSeconds,
        uint256 newReserveMultiplierE18,
        uint256 newMaxExpansionPerCycle
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _validatePolicy(newReserveShareBps, newCooldownSeconds, newReserveMultiplierE18);
        require(newMaxExpansionPerCycle > 0, "cap=0");

        reserveShareBps = newReserveShareBps;
        cooldownSeconds = newCooldownSeconds;
        reserveMultiplierE18 = newReserveMultiplierE18;
        maxExpansionPerCycle = newMaxExpansionPerCycle;

        emit ReservePolicyUpdated(
            newReserveShareBps, newCooldownSeconds, newReserveMultiplierE18, newMaxExpansionPerCycle
        );
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _executeExpansion(
        address recipient,
        uint256 mintedAmount,
        uint256 reserveDeltaRecorded,
        bytes32 evidenceHash,
        string memory expansionKind
    ) internal {
        require(recipient != address(0), "recipient=0");
        require(evidenceHash != bytes32(0), "evidence=0");
        require(!usedEvidenceHash[evidenceHash], "evidence used");
        require(lastExpansionAt == 0 || block.timestamp >= lastExpansionAt + cooldownSeconds, "cooldown");
        require(mintedAmount > 0, "mint=0");
        require(mintedAmount <= maxExpansionPerCycle, "cycle cap");

        lastExpansionAt = block.timestamp;
        totalExpansionMinted += mintedAmount;
        usedEvidenceHash[evidenceHash] = true;

        xbgl.mint(recipient, mintedAmount);

        emit ReserveExpansionMinted(
            recipient, mintedAmount, reserveDeltaRecorded, evidenceHash, msg.sender, expansionKind
        );
    }

    function _validatePolicy(uint256 shareBps, uint256 cooldown, uint256 multiplierE18) internal pure {
        require(shareBps > 0 && shareBps <= BPS, "share");
        require(cooldown > 0, "cooldown=0");
        require(
            multiplierE18 >= MIN_RESERVE_MULTIPLIER_E18 && multiplierE18 <= MAX_RESERVE_MULTIPLIER_E18, "k range"
        );
    }
}
