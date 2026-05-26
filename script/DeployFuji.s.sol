// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/Phase1Hub1155.sol";
import "../src/contracts/phase1/TestUSDC.sol";

contract DeployFuji is Script {
    uint256 internal constant FUJI_CHAIN_ID = 43_113;

    function run() external {
        require(block.chainid == FUJI_CHAIN_ID, "Fuji only");

        uint256 privateKey = vm.envUint("FUJI_PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        address treasury = 0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33;

        vm.startBroadcast(privateKey);

        TestUSDC usdc = new TestUSDC(deployer);
        XBGLToken xbgl = new XBGLToken(deployer, treasury);
        Phase1Hub1155 hub = new Phase1Hub1155(
            deployer,
            address(xbgl),
            address(usdc), // Deployed test USDC
            treasury,
            1e18, // 1 USDC => 1 xBGL
            10_000,
            10e6,
            10_000e6,
            100_000e6,
            100e18,
            10_000,
            "ipfs://phase1/{id}.json"
        );

        xbgl.grantRole(xbgl.MINTER_ROLE(), address(hub));
        usdc.mint(deployer, 1_000_000e6);

        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("TestUSDC:", address(usdc));
        console2.log("XBGLToken:", address(xbgl));
        console2.log("Phase1Hub1155:", address(hub));
    }
}
