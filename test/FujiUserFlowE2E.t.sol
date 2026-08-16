// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {StdStorage, stdStorage} from "forge-std/StdStorage.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/SaraktTreasury.sol";
import "../src/contracts/phase1/LocalDigitalID.sol";
import "../src/contracts/phase1/SaraktLandV2.sol";

/// @notice Full user flow: fund → deposit AVAX→xBGL → buy plot → pause drill.
contract FujiUserFlowE2ETest is Test {
    using stdStorage for StdStorage;

    XBGLToken internal xbgl;
    SaraktTreasury internal treasury;
    LocalDigitalID internal digitalID;
    SaraktLandV2 internal land;

    address internal operator = address(this);
    address internal user = address(0xB0B);
    uint256 internal constant PLOT_PRICE = 1955833 * 1e14; // ~195.5833 xBGL
    uint256 internal constant RATE = 20 ether; // 20 xBGL / AVAX

    receive() external payable {}

    function setUp() public {
        xbgl = new XBGLToken(operator, operator);
        address[] memory tokens = new address[](1);
        tokens[0] = address(xbgl);
        treasury = new SaraktTreasury(tokens);
        treasury.setXbglToken(address(xbgl));
        treasury.setXbglPerAvax(RATE);
        xbgl.transfer(address(treasury), 1_000_000 ether);

        digitalID = new LocalDigitalID();
        land = new SaraktLandV2(address(treasury), address(digitalID));
        treasury.setLandContract(address(land));
        land.setPlotRegistrar(address(treasury));
        land.setUSDC(address(xbgl));
        land.setPhase1Prices(0, PLOT_PRICE);
        land.setTreasuryRouting(payable(address(treasury)), payable(address(treasury)));
        // Sales start off (staging default), then operator enables.
        assertFalse(land.salesActive());
        assertFalse(land.requireDigitalID());
        land.toggleSales(true);

        vm.deal(user, 50 ether);
    }

    function test_fullUserFlow_depositBuyPause() public {
        // 1) User deposits AVAX for xBGL
        uint256 depositAvax = 15 ether; // 15 * 20 = 300 xBGL > plot price
        vm.prank(user);
        treasury.depositAvaxForXbgl{value: depositAvax}(0);
        uint256 xbglBal = xbgl.balanceOf(user);
        assertEq(xbglBal, depositAvax * RATE / 1e18);
        assertGe(xbglBal, PLOT_PRICE);

        // 2) Approve + buy plot with xBGL
        uint256 plotId = 101;
        vm.startPrank(user);
        xbgl.approve(address(land), PLOT_PRICE);
        land.buyPlotWithUSDC(plotId, PLOT_PRICE);
        vm.stopPrank();

        assertEq(land.balanceOf(user, plotId), 1);
        assertTrue(land.plotMinted(plotId));
        assertEq(land.plotsSold(), 1);
        assertTrue(treasury.isPlotRegistered(plotId));
        (address buyer,,,, bool registered) = treasury.getPlotRecord(plotId);
        assertTrue(registered);
        assertEq(buyer, user);

        // 3) Second buy blocked while paused (both sides)
        land.pause();
        treasury.pause();
        vm.startPrank(user);
        xbgl.approve(address(land), PLOT_PRICE);
        vm.expectRevert();
        land.buyPlotWithUSDC(102, PLOT_PRICE);
        vm.expectRevert();
        treasury.depositAvaxForXbgl{value: 1 ether}(0);
        vm.stopPrank();

        // 4) Emergency withdraw still works while paused
        uint256 avaxBefore = operator.balance;
        treasury.withdrawAVAX(payable(operator), 1 ether);
        assertEq(operator.balance, avaxBefore + 1 ether);

        // 5) Unpause restores deposit path
        land.unpause();
        treasury.unpause();
        vm.prank(user);
        treasury.depositAvaxForXbgl{value: 1 ether}(0);
        assertEq(xbgl.balanceOf(user), xbglBal - PLOT_PRICE + RATE);
    }

    function test_salesOff_blocksBuyUntilToggle() public {
        land.toggleSales(false);
        // Fund user directly
        xbgl.transfer(user, PLOT_PRICE);
        vm.startPrank(user);
        xbgl.approve(address(land), PLOT_PRICE);
        vm.expectRevert("Sales not active");
        land.buyPlotWithUSDC(201, PLOT_PRICE);
        vm.stopPrank();

        land.toggleSales(true);
        vm.startPrank(user);
        land.buyPlotWithUSDC(201, PLOT_PRICE);
        vm.stopPrank();
        assertEq(land.balanceOf(user, 201), 1);
    }

    function test_adminResetPlot_allowsRebuy() public {
        vm.chainId(43_113);
        xbgl.transfer(user, PLOT_PRICE * 2);
        vm.startPrank(user);
        xbgl.approve(address(land), PLOT_PRICE * 2);
        land.buyPlotWithUSDC(301, PLOT_PRICE);
        vm.stopPrank();
        assertTrue(land.plotMinted(301));
        assertTrue(treasury.isPlotRegistered(301));
        assertEq(land.plotsSold(), 1);

        land.pause();
        land.adminResetPlot(301, user);

        assertFalse(land.plotMinted(301));
        assertEq(land.balanceOf(user, 301), 0);
        assertEq(land.plotsSold(), 0);
        assertFalse(treasury.isPlotRegistered(301));

        land.unpause();
        vm.startPrank(user);
        land.buyPlotWithUSDC(301, PLOT_PRICE);
        vm.stopPrank();
        assertEq(land.balanceOf(user, 301), 1);
        assertTrue(treasury.isPlotRegistered(301));
    }

    function test_adminResetPlot_revertsOnMainnetChainId() public {
        vm.chainId(43_114);
        xbgl.transfer(user, PLOT_PRICE);
        vm.startPrank(user);
        xbgl.approve(address(land), PLOT_PRICE);
        land.buyPlotWithUSDC(302, PLOT_PRICE);
        vm.stopPrank();
        land.pause();
        vm.expectRevert("testnet only");
        land.adminResetPlot(302, user);
    }

    function test_adminGrantPlot_freeMintAndResetLoop() public {
        vm.chainId(43_113);
        address tester = address(0xC0FFEE);

        land.adminGrantPlot(tester, 401);
        assertEq(land.balanceOf(tester, 401), 1);
        assertTrue(land.plotMinted(401));
        assertTrue(treasury.isPlotRegistered(401));
        (address buyer, uint256 pricePaid,,, bool registered) = treasury.getPlotRecord(401);
        assertTrue(registered);
        assertEq(buyer, tester);
        assertEq(pricePaid, 0);

        // Cannot grant twice
        vm.expectRevert("Already sold");
        land.adminGrantPlot(tester, 401);

        // Reset + re-grant without paying
        land.pause();
        land.adminResetPlot(401, tester);
        land.unpause();
        land.adminGrantPlot(tester, 401);
        assertEq(land.balanceOf(tester, 401), 1);
        assertEq(land.plotsSold(), 1);
    }

    function test_adminGrantPlot_revertsOnMainnetChainId() public {
        vm.chainId(43_114);
        vm.expectRevert("testnet only");
        land.adminGrantPlot(user, 402);
    }

    function test_adminClearPendingBuyer() public {
        vm.chainId(43_113);
        stdstore.target(address(land)).sig("pendingBuyer(uint256)").with_key(uint256(501)).checked_write(user);
        assertEq(land.pendingBuyer(501), user);

        land.adminClearPendingBuyer(501);
        assertEq(land.pendingBuyer(501), address(0));

        vm.expectRevert("no pending");
        land.adminClearPendingBuyer(501);
    }
}
