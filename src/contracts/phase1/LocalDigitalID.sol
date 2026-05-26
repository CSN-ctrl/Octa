// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @notice Minimal digital ID for local AVAX deploys (matches SaraktLandV2 IDigitalID).
contract LocalDigitalID is Ownable {
    mapping(address => bool) private _active;

    constructor() Ownable(msg.sender) {}

    function ids(address user) external view returns (string memory, string memory, uint256, bool) {
        return ("", "", 0, _active[user]);
    }

    function setActive(address user, bool active) external onlyOwner {
        _active[user] = active;
    }
}
