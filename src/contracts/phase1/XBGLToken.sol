// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";

/**
 * @title XBGLToken
 * @notice Bulgarian Reserve (xBGL) — reserve-backed ERC-20 monetary asset for the Sarakt ecosystem.
 * @dev Avalanche C-Chain (Phase 1). Not a stablecoin, not redeemable, not fiat-pegged.
 *      Fixed genesis supply; further supply only via `ReserveMintController` (MINTER_ROLE).
 *      See docs/xbgl-protocol-spec.md.
 */
contract XBGLToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Fixed genesis supply — 10,000,000,000 xBGL (18 decimals).
    uint256 public constant GENESIS_SUPPLY = 10_000_000_000 ether;

    event GenesisMinted(address indexed recipient, uint256 amount);
    event Minted(address indexed to, uint256 amount, address indexed operator);

    constructor(address admin, address genesisRecipient) ERC20("Bulgarian Reserve", "xBGL") {
        require(admin != address(0), "admin=0");
        require(genesisRecipient != address(0), "genesis=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _mint(genesisRecipient, GENESIS_SUPPLY);
        emit GenesisMinted(genesisRecipient, GENESIS_SUPPLY);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "to=0");
        require(amount > 0, "amount=0");
        _mint(to, amount);
        emit Minted(to, amount, msg.sender);
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
