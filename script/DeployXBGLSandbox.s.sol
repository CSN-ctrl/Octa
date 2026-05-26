// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/contracts/phase1/ReserveMintController.sol";
import "../src/contracts/phase1/XBGLToken.sol";

/**
 * @notice Standalone xBGL deployment script for local/Fuji testing.
 * @dev This does not deploy or wire the app hub, UI, Supabase, or land-sale flow.
 */
contract DeployXBGLSandbox is Script {
    address internal constant TREASURY_WALLET = 0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33;
    uint256 internal constant RESERVE_SHARE_BPS = 3_000; // 30% of income
    uint256 internal constant EXPANSION_COOLDOWN_SECONDS = 7 days;
    uint256 internal constant RESERVE_MULTIPLIER_E18 = 2 ether;
    uint256 internal constant MAX_EXPANSION_PER_CYCLE = 1_000_000 ether;

    function run() external {
        uint256 privateKey = vm.envUint("XBGL_DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        vm.startBroadcast(privateKey);

        XBGLToken xbgl = new XBGLToken(deployer, TREASURY_WALLET);
        ReserveMintController reserveMintController = new ReserveMintController(
            deployer,
            address(xbgl),
            RESERVE_SHARE_BPS,
            EXPANSION_COOLDOWN_SECONDS,
            RESERVE_MULTIPLIER_E18,
            MAX_EXPANSION_PER_CYCLE
        );

        xbgl.grantRole(xbgl.MINTER_ROLE(), address(reserveMintController));

        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("Genesis recipient:", TREASURY_WALLET);
        console2.log("XBGLToken:", address(xbgl));
        console2.log("ReserveMintController:", address(reserveMintController));
    }
}
