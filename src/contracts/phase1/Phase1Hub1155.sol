// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

interface IXBGLToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Phase1Hub1155
 * @notice Unified Phase 1 contract (ERC1155) for USDC deposits and land sales.
 * @dev xBGL remains ERC20 and must grant MINTER_ROLE to this contract.
 */
contract Phase1Hub1155 is ERC1155Supply, Ownable, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant USDC_DECIMALS = 1e6;
    bytes32 public constant OPERATIONS_ROLE = keccak256("OPERATIONS_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RAFFLE_MANAGER_ROLE = keccak256("RAFFLE_MANAGER_ROLE");

    IXBGLToken public immutable xbgl;
    IERC20 public immutable usdc;

    address public treasuryWallet;

    // xBGL wei minted per 1 USDC (1e6 units). Example: 1e18 => 1 USDC => 1 xBGL.
    uint256 public usdcToXbglRateE18;

    // Deposit controls
    bool public phase1Open;
    uint256 public maxParticipants;
    uint256 public participantCount;
    uint256 public minDepositUsdc;
    uint256 public maxDepositUsdcPerTx;
    uint256 public maxDepositUsdcPerWallet;

    mapping(address => bool) public isParticipant;
    mapping(address => uint256) public walletDepositedUsdc;
    mapping(bytes32 => bool) public usedDepositRefs;

    // Land sale controls
    bool public landSaleOpen;
    bool public landSaleFrozen;
    uint256 public maxPlotId;
    uint256 public plotPriceXbgl;

    // Accounting visibility
    uint256 public totalUsdcReceived;
    uint256 public totalXbglMintedFromDeposits;
    mapping(address => uint256) public plotsOwned;

    // Raffle (1 BTC) eligibility and entry state.
    // Social actions are verified off-chain and attested on-chain by owner.
    bool public raffleOpen;
    bool public raffleDrawn;
    address public raffleWinner;
    mapping(address => bool) public socialTasksCompleted;
    mapping(address => bool) public raffleEntered;
    address[] public raffleEntries;

    event TreasuryWalletUpdated(address indexed previousWallet, address indexed newWallet);
    event UsdcToXbglRateUpdated(uint256 previousRate, uint256 newRate);
    event Phase1StatusUpdated(bool open);
    event DepositLimitsUpdated(
        uint256 maxParticipants,
        uint256 minDepositUsdc,
        uint256 maxDepositUsdcPerTx,
        uint256 maxDepositUsdcPerWallet
    );
    event DepositProcessed(
        address indexed payer,
        address indexed recipient,
        uint256 usdcIn,
        uint256 xbglOut,
        bool isNewParticipant,
        uint256 participantCount,
        bytes32 depositRef
    );
    event LandSaleStatusUpdated(bool open);
    event LandSaleFrozenUpdated(bool frozen);
    event PlotPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event MaxPlotIdUpdated(uint256 previousMaxPlotId, uint256 newMaxPlotId);
    event LandPurchased(
        address indexed buyer,
        address indexed recipient,
        uint256 indexed plotId,
        uint256 priceXbgl
    );
    event BaseURIUpdated(string newBaseURI);
    event SocialTasksUpdated(address indexed participant, bool completed, bytes32 evidenceRef);
    event RaffleStatusUpdated(bool open);
    event RaffleEntered(address indexed participant, uint256 totalEntries);
    event RaffleWinnerSelected(address indexed winner, uint256 indexed winnerIndex, bytes32 drawRef);
    event RecoveredToken(address indexed token, address indexed to, uint256 amount);

    constructor(
        address admin,
        address xbglToken,
        address usdcToken,
        address treasury,
        uint256 initialRateE18,
        uint256 initialMaxParticipants,
        uint256 initialMinDepositUsdc,
        uint256 initialMaxDepositUsdcPerTx,
        uint256 initialMaxDepositUsdcPerWallet,
        uint256 initialPlotPriceXbgl,
        uint256 initialMaxPlotId,
        string memory baseURI
    ) ERC1155(baseURI) Ownable(admin) {
        require(admin != address(0), "admin=0");
        require(xbglToken != address(0), "xbgl=0");
        require(usdcToken != address(0), "usdc=0");
        require(treasury != address(0), "treasury=0");
        require(initialRateE18 > 0, "rate=0");
        require(initialMaxParticipants > 0, "participants=0");
        require(initialMinDepositUsdc > 0, "min=0");
        require(initialMaxDepositUsdcPerTx >= initialMinDepositUsdc, "tx<min");
        require(initialMaxDepositUsdcPerWallet >= initialMaxDepositUsdcPerTx, "wallet<tx");
        require(initialPlotPriceXbgl > 0, "plotPrice=0");
        require(initialMaxPlotId > 0, "maxPlotId=0");

        xbgl = IXBGLToken(xbglToken);
        usdc = IERC20(usdcToken);
        treasuryWallet = treasury;
        usdcToXbglRateE18 = initialRateE18;

        maxParticipants = initialMaxParticipants;
        minDepositUsdc = initialMinDepositUsdc;
        maxDepositUsdcPerTx = initialMaxDepositUsdcPerTx;
        maxDepositUsdcPerWallet = initialMaxDepositUsdcPerWallet;

        plotPriceXbgl = initialPlotPriceXbgl;
        maxPlotId = initialMaxPlotId;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(OPERATIONS_ROLE, admin);
        _grantRole(RAFFLE_MANAGER_ROLE, admin);
    }

    function quoteXbglOut(uint256 usdcAmount) public view returns (uint256) {
        return (usdcAmount * usdcToXbglRateE18) / USDC_DECIMALS;
    }

    function depositUSDC(
        uint256 usdcAmount,
        uint256 minXbglOut,
        address recipient,
        bytes32 depositRef
    ) external nonReentrant whenNotPaused returns (uint256 xbglOut) {
        require(phase1Open, "phase1 closed");
        require(recipient != address(0), "recipient=0");
        require(usdcAmount >= minDepositUsdc, "below min");
        require(usdcAmount <= maxDepositUsdcPerTx, "above tx cap");

        uint256 nextWalletTotal = walletDepositedUsdc[recipient] + usdcAmount;
        require(nextWalletTotal <= maxDepositUsdcPerWallet, "above wallet cap");

        if (depositRef != bytes32(0)) {
            require(!usedDepositRefs[depositRef], "depositRef used");
            usedDepositRefs[depositRef] = true;
        }

        bool newParticipant = !isParticipant[recipient];
        if (newParticipant) {
            require(participantCount < maxParticipants, "participant cap reached");
            isParticipant[recipient] = true;
            participantCount += 1;
        }

        xbglOut = quoteXbglOut(usdcAmount);
        require(xbglOut >= minXbglOut, "slippage");
        require(xbglOut > 0, "xbgl=0");

        walletDepositedUsdc[recipient] = nextWalletTotal;
        totalUsdcReceived += usdcAmount;
        totalXbglMintedFromDeposits += xbglOut;

        usdc.safeTransferFrom(msg.sender, treasuryWallet, usdcAmount);
        xbgl.mint(recipient, xbglOut);

        emit DepositProcessed(
            msg.sender,
            recipient,
            usdcAmount,
            xbglOut,
            newParticipant,
            participantCount,
            depositRef
        );
    }

    modifier landSaleActive() {
        require(landSaleOpen, "land sale closed");
        require(!landSaleFrozen, "land sale frozen");
        _;
    }

    function buyPlot(uint256 plotId) external nonReentrant whenNotPaused landSaleActive {
        _buyPlot(plotId, msg.sender);
    }

    function buyPlotFor(uint256 plotId, address recipient) external nonReentrant whenNotPaused landSaleActive {
        require(recipient != address(0), "recipient=0");
        _buyPlot(plotId, recipient);
    }

    function _buyPlot(uint256 plotId, address recipient) internal {
        require(plotId > 0 && plotId <= maxPlotId, "invalid plot");
        require(totalSupply(plotId) == 0, "already sold");

        IERC20(address(xbgl)).safeTransferFrom(msg.sender, treasuryWallet, plotPriceXbgl);
        _mint(recipient, plotId, 1, "");
        plotsOwned[recipient] += 1;

        emit LandPurchased(msg.sender, recipient, plotId, plotPriceXbgl);
    }

    function raffleEntriesLength() external view returns (uint256) {
        return raffleEntries.length;
    }

    /**
     * @notice Owner attests whether social requirements are completed.
     * @dev Requirements are checked off-chain (follow on X/Instagram/TikTok + 3 comments).
     */
    modifier onlyOperationsOrAdmin() {
        require(
            hasRole(OPERATIONS_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "missing operations role"
        );
        _;
    }

    function setSocialTasksCompleted(
        address participant,
        bool completed,
        bytes32 evidenceRef
    ) external onlyOperationsOrAdmin {
        require(participant != address(0), "participant=0");
        socialTasksCompleted[participant] = completed;
        emit SocialTasksUpdated(participant, completed, evidenceRef);
    }

    function setRaffleOpen(bool open) external onlyRole(RAFFLE_MANAGER_ROLE) {
        if (open) {
            require(!raffleDrawn, "raffle already drawn");
        }
        raffleOpen = open;
        emit RaffleStatusUpdated(open);
    }

    /**
     * @notice Enter raffle for 1 BTC distribution.
     * Requirements:
     * - Own at least 1 land plot
     * - Social tasks attested by owner
     * - One entry per participant
     */
    function enterRaffle() external nonReentrant whenNotPaused {
        require(raffleOpen, "raffle closed");
        require(!raffleDrawn, "raffle drawn");
        require(plotsOwned[msg.sender] >= 1, "need at least 1 plot");
        require(socialTasksCompleted[msg.sender], "social tasks incomplete");
        require(!raffleEntered[msg.sender], "already entered");

        raffleEntered[msg.sender] = true;
        raffleEntries.push(msg.sender);

        emit RaffleEntered(msg.sender, raffleEntries.length);
    }

    /**
     * @notice Select winner by index using off-chain verifiable randomness.
     * @param winnerIndex Index within raffleEntries array.
     * @param drawRef Reference hash to randomness proof/process metadata.
     */
    function selectRaffleWinnerByIndex(
        uint256 winnerIndex,
        bytes32 drawRef
    ) external onlyRole(RAFFLE_MANAGER_ROLE) returns (address winner) {
        require(!raffleDrawn, "raffle already drawn");
        require(raffleEntries.length > 0, "no entries");
        require(winnerIndex < raffleEntries.length, "winnerIndex out of range");
        require(drawRef != bytes32(0), "drawRef=0");

        winner = raffleEntries[winnerIndex];
        raffleWinner = winner;
        raffleDrawn = true;
        raffleOpen = false;

        emit RaffleStatusUpdated(false);
        emit RaffleWinnerSelected(winner, winnerIndex, drawRef);
    }

    // ----------- Admin -----------
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setTreasuryWallet(address newTreasuryWallet) external onlyOwner {
        require(newTreasuryWallet != address(0), "treasury=0");
        address previousWallet = treasuryWallet;
        treasuryWallet = newTreasuryWallet;
        emit TreasuryWalletUpdated(previousWallet, newTreasuryWallet);
    }

    function setUsdcToXbglRate(uint256 newRateE18) external onlyOwner {
        require(newRateE18 > 0, "rate=0");
        uint256 previousRate = usdcToXbglRateE18;
        usdcToXbglRateE18 = newRateE18;
        emit UsdcToXbglRateUpdated(previousRate, newRateE18);
    }

    function setPhase1Open(bool open) external onlyOwner {
        phase1Open = open;
        emit Phase1StatusUpdated(open);
    }

    function setDepositLimits(
        uint256 newMaxParticipants,
        uint256 newMinDepositUsdc,
        uint256 newMaxDepositUsdcPerTx,
        uint256 newMaxDepositUsdcPerWallet
    ) external onlyOwner {
        require(newMaxParticipants >= participantCount, "participants<current");
        require(newMinDepositUsdc > 0, "min=0");
        require(newMaxDepositUsdcPerTx >= newMinDepositUsdc, "tx<min");
        require(newMaxDepositUsdcPerWallet >= newMaxDepositUsdcPerTx, "wallet<tx");

        maxParticipants = newMaxParticipants;
        minDepositUsdc = newMinDepositUsdc;
        maxDepositUsdcPerTx = newMaxDepositUsdcPerTx;
        maxDepositUsdcPerWallet = newMaxDepositUsdcPerWallet;

        emit DepositLimitsUpdated(
            newMaxParticipants,
            newMinDepositUsdc,
            newMaxDepositUsdcPerTx,
            newMaxDepositUsdcPerWallet
        );
    }

    function setLandSaleOpen(bool open) external onlyOwner {
        landSaleOpen = open;
        emit LandSaleStatusUpdated(open);
    }

    function setLandSaleFrozen(bool frozen) external onlyOwner {
        landSaleFrozen = frozen;
        emit LandSaleFrozenUpdated(frozen);
    }

    function setPlotPriceXbgl(uint256 newPlotPriceXbgl) external onlyOwner {
        require(newPlotPriceXbgl > 0, "plotPrice=0");
        uint256 previousPrice = plotPriceXbgl;
        plotPriceXbgl = newPlotPriceXbgl;
        emit PlotPriceUpdated(previousPrice, newPlotPriceXbgl);
    }

    function setMaxPlotId(uint256 newMaxPlotId) external onlyOwner {
        require(newMaxPlotId > 0, "maxPlotId=0");
        uint256 previousMaxPlotId = maxPlotId;
        maxPlotId = newMaxPlotId;
        emit MaxPlotIdUpdated(previousMaxPlotId, newMaxPlotId);
    }

    function setURI(string calldata newBaseURI) external onlyOwner {
        _setURI(newBaseURI);
        emit BaseURIUpdated(newBaseURI);
    }

    function recoverERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        require(token != address(usdc), "cannot recover usdc");
        require(token != address(xbgl), "cannot recover xbgl");
        IERC20(token).safeTransfer(to, amount);
        emit RecoveredToken(token, to, amount);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
