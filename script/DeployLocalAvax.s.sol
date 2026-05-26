// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/contracts/phase1/ReserveMintController.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/SaraktTreasury.sol";
import "../src/contracts/phase1/LocalDigitalID.sol";
import "../src/contracts/phase1/SaraktLandV2.sol";

/// @notice Full game stack on Avalanche C-Chain (1337 local or 43113 Fuji).
contract DeployLocalAvax is Script {
    address internal constant TREASURY_WALLET = 0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33;
    uint256 internal constant RESERVE_SHARE_BPS = 3_000;
    uint256 internal constant EXPANSION_COOLDOWN_SECONDS = 7 days;
    uint256 internal constant RESERVE_MULTIPLIER_E18 = 2 ether;
    uint256 internal constant MAX_EXPANSION_PER_CYCLE = 1_000_000 ether;
    uint256 internal constant DEFAULT_PLOT_PRICE_XBGL = 195583300000000000000;
    uint256 internal constant TREASURY_XBGL_LIQUIDITY = 1_000_000 ether;

    function run() external virtual {
        _deploy();
    }

    function _deploy() internal {
        uint256 privateKey = vm.envUint("XBGL_DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        address chaosRef = vm.envOr("CHAOSSTAR_XBGL_ADDRESS", address(0));
        address existingXbgl = vm.envOr("XBGL_TOKEN_ADDRESS", address(0));
        uint256 plotPriceXbgl = vm.envOr("PHASE1_PRICE_XBGL_WEI", DEFAULT_PLOT_PRICE_XBGL);

        vm.startBroadcast(privateKey);

        address xbglAddr;
        if (existingXbgl != address(0)) {
            xbglAddr = existingXbgl;
            console2.log("Using existing XBGLToken:", xbglAddr);
        } else {
            XBGLToken xbgl = new XBGLToken(deployer, deployer);
            ReserveMintController reserveMintController = new ReserveMintController(
                deployer,
                address(xbgl),
                RESERVE_SHARE_BPS,
                EXPANSION_COOLDOWN_SECONDS,
                RESERVE_MULTIPLIER_E18,
                MAX_EXPANSION_PER_CYCLE
            );
            xbgl.grantRole(xbgl.MINTER_ROLE(), address(reserveMintController));
            xbglAddr = address(xbgl);
            console2.log("ReserveMintController:", address(reserveMintController));
        }

        address[] memory tokens = new address[](1);
        tokens[0] = xbglAddr;
        SaraktTreasury treasury = new SaraktTreasury(tokens);
        treasury.setXbglToken(xbglAddr);

        LocalDigitalID digitalID = new LocalDigitalID();
        SaraktLandV2 land = new SaraktLandV2(address(treasury), address(digitalID));

        treasury.setLandContract(address(land));
        land.setPlotRegistrar(address(treasury));
        land.setUSDC(xbglAddr);
        land.setPhase1Prices(0, plotPriceXbgl);
        land.setTreasuryRouting(payable(address(treasury)), payable(address(treasury)));
        land.toggleSales(true);

        uint256 liquidity = vm.envOr("SANDBOX_TREASURY_XBGL_WEI", TREASURY_XBGL_LIQUIDITY);
        XBGLToken(xbglAddr).transfer(address(treasury), liquidity);
        console2.log("Treasury xBGL liquidity:", liquidity);

        string memory metadataBase = vm.envOr(
            "SANDBOX_METADATA_BASE_URI",
            string("http://localhost:8080/metadata/land/{id}.json")
        );
        land.setMetadataURI(metadataBase);

        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        if (chaosRef != address(0)) {
            console2.log("ChaosStarXbglReference:", chaosRef);
        }
        console2.log("XBGLToken:", xbglAddr);
        console2.log("SaraktTreasury (plot registry):", address(treasury));
        console2.log("SaraktLandV2:", address(land));
        console2.log("Phase1PriceXBGL:", plotPriceXbgl);
    }
}
