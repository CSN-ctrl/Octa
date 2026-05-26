// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/SaraktTreasury.sol";
import "../src/contracts/phase1/LocalDigitalID.sol";
import "../src/contracts/phase1/SaraktLandV2.sol";

contract TreasuryPlotRegistryTest is Test {
    XBGLToken internal xbgl;
    SaraktTreasury internal treasury;
    SaraktLandV2 internal land;

    address internal admin = address(0xA11CE);
    address internal genesis = address(0xBEEF);
    address internal buyer = address(0xCAFE);

    uint256 internal constant PLOT_PRICE = 100 ether;

    function setUp() public {
        vm.startPrank(admin);
        xbgl = new XBGLToken(admin, genesis);
        address[] memory tokens = new address[](1);
        tokens[0] = address(xbgl);
        treasury = new SaraktTreasury(tokens);
        treasury.setXbglToken(address(xbgl));
        LocalDigitalID digitalID = new LocalDigitalID();
        land = new SaraktLandV2(address(treasury), address(digitalID));
        treasury.setLandContract(address(land));
        land.setPlotRegistrar(address(treasury));
        land.setUSDC(address(xbgl));
        land.setPhase1Prices(0, PLOT_PRICE);
        land.setTreasuryRouting(payable(address(treasury)), payable(address(treasury)));
        land.toggleSales(true);
        vm.stopPrank();

        vm.prank(genesis);
        xbgl.transfer(buyer, 1_000 ether);
    }

    function testBuyPlotRegistersInTreasury() public {
        vm.startPrank(buyer);
        xbgl.approve(address(land), PLOT_PRICE);
        land.buyPlotWithUSDC(42, PLOT_PRICE);
        vm.stopPrank();

        (address registeredBuyer, uint256 price,,, bool registered) = treasury.getPlotRecord(42);
        assertTrue(registered);
        assertEq(registeredBuyer, buyer);
        assertEq(price, PLOT_PRICE);
        assertTrue(treasury.isPlotRegistered(42));
    }
}
