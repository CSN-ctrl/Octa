// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/contracts/phase1/SaraktTreasury.sol";
import "../../src/contracts/phase1/LocalDigitalID.sol";
import "../../src/contracts/phase1/SaraktLandV2.sol";

/// @notice In-memory sandbox: land Phase 1 AVAX pay + owner activation (no RPC).
contract LocalLandFlowTest is Test {
    SaraktLandV2 internal land;
    address internal deployer = address(0xA11CE);
    address internal buyer = address(0xB0B);

    function setUp() public {
        vm.deal(deployer, 100 ether);
        vm.deal(buyer, 10 ether);

        vm.startPrank(deployer);
        address[] memory tokens = new address[](0);
        SaraktTreasury treasury = new SaraktTreasury(tokens);
        LocalDigitalID digitalID = new LocalDigitalID();
        land = new SaraktLandV2(address(treasury), address(digitalID));
        land.setPhase1Prices(0.01 ether, 0);
        land.setTreasuryRouting(payable(deployer), payable(deployer));
        land.toggleSales(true);
        vm.stopPrank();
    }

    function test_buyPlotWithAVAX_mintsImmediately() public {
        vm.prank(buyer);
        land.buyPlotWithAVAX{value: 0.01 ether}(42);
        assertEq(land.balanceOf(buyer, 42), 1);
        assertTrue(land.plotMinted(42));
        assertEq(land.pendingBuyer(42), address(0));
    }

    function test_activatePlot_mintsToRecipientOverride() public {
        address cold = address(0xC01D);
        vm.prank(deployer);
        land.activatePlot(7, cold);
        assertEq(land.balanceOf(cold, 7), 1);
        assertTrue(land.plotMinted(7));
    }

    function test_rejectsBuyWhenSalesInactive() public {
        vm.prank(deployer);
        land.toggleSales(false);

        vm.prank(buyer);
        vm.expectRevert("Sales not active");
        land.buyPlotWithAVAX{value: 0.01 ether}(1);
    }
}
