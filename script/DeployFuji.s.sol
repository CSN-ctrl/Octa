// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DeployLocalAvax.s.sol";

/// @notice Fuji (43113) entrypoint — prefer `npm run sandbox:deploy:fuji`.
contract DeployFuji is DeployLocalAvax {
    uint256 internal constant FUJI_CHAIN_ID = 43_113;

    function run() external override {
        require(block.chainid == FUJI_CHAIN_ID, "Fuji only (43113)");
        _deploy();
    }
}
