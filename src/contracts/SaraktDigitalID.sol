// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract SaraktDigitalID is Ownable {
    constructor() Ownable(msg.sender) {}
    struct DigitalID {
        string username;
        string emailHash;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => DigitalID) public ids;

    event IDRegistered(address indexed user, string username, uint256 timestamp);
    event IDDeactivated(address indexed user, uint256 timestamp);

    function registerID(string memory username, string memory emailHash) external {
        require(bytes(username).length > 0, "Username required");
        require(!ids[msg.sender].active, "ID exists");

        ids[msg.sender] = DigitalID({
            username: username,
            emailHash: emailHash,
            registeredAt: block.timestamp,
            active: true
        });

        emit IDRegistered(msg.sender, username, block.timestamp);
    }

    function deactivateID() external {
        require(ids[msg.sender].active, "ID not active");
        ids[msg.sender].active = false;
        emit IDDeactivated(msg.sender, block.timestamp);
    }

    function getID(address user) external view returns (DigitalID memory) {
        require(ids[user].active, "ID not active");
        return ids[user];
    }
}
