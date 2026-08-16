// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/SaraktTreasury.sol";
import "../src/contracts/phase1/LocalDigitalID.sol";
import "../src/contracts/phase1/SaraktLandV2.sol";

contract SaraktAccessControlTest is Test {
    XBGLToken internal xbgl;
    SaraktTreasury internal treasury;
    LocalDigitalID internal digitalID;
    SaraktLandV2 internal land;

    address internal owner = address(this);
    address internal safe = address(0x5AFE);
    address internal user = address(0xBEEF);
    address internal stranger = address(0xBAD);

    receive() external payable {}

    function setUp() public {
        xbgl = new XBGLToken(owner, owner);
        address[] memory tokens = new address[](1);
        tokens[0] = address(xbgl);
        treasury = new SaraktTreasury(tokens);
        treasury.setXbglToken(address(xbgl));
        treasury.setXbglPerAvax(20 ether);
        xbgl.transfer(address(treasury), 1_000_000 ether);

        digitalID = new LocalDigitalID();
        land = new SaraktLandV2(address(treasury), address(digitalID));
        treasury.setLandContract(address(land));
        land.setPlotRegistrar(address(treasury));
        land.setUSDC(address(xbgl));
        land.setPhase1Prices(0, 100 ether);
        land.setTreasuryRouting(payable(address(treasury)), payable(address(treasury)));
        land.toggleSales(true);

        vm.deal(user, 100 ether);
        xbgl.transfer(user, 1_000 ether);
    }

    function test_requireDigitalID_staysFalse() public view {
        assertFalse(land.requireDigitalID());
    }

    function test_ownable2Step_treasury() public {
        assertEq(treasury.owner(), owner);
        treasury.transferOwnership(safe);
        assertEq(treasury.owner(), owner);
        assertEq(treasury.pendingOwner(), safe);

        vm.prank(stranger);
        vm.expectRevert();
        treasury.acceptOwnership();

        vm.prank(safe);
        treasury.acceptOwnership();
        assertEq(treasury.owner(), safe);
        assertEq(treasury.pendingOwner(), address(0));
    }

    function test_ownable2Step_land() public {
        land.transferOwnership(safe);
        assertEq(land.owner(), owner);
        assertEq(land.pendingOwner(), safe);

        vm.prank(safe);
        land.acceptOwnership();
        assertEq(land.owner(), safe);
    }

    function test_pause_blocks_depositAvaxForXbgl() public {
        treasury.pause();
        vm.prank(user);
        vm.expectRevert();
        treasury.depositAvaxForXbgl{value: 1 ether}(0);
    }

    function test_pause_blocks_land_buy() public {
        land.pause();
        vm.startPrank(user);
        xbgl.approve(address(land), 100 ether);
        vm.expectRevert();
        land.buyPlotWithUSDC(1, 100 ether);
        vm.stopPrank();
    }

    function test_unpause_restores_deposit() public {
        treasury.pause();
        treasury.unpause();
        vm.prank(user);
        treasury.depositAvaxForXbgl{value: 1 ether}(19 ether);
        assertEq(xbgl.balanceOf(user), 1_000 ether + 20 ether);
    }

    function test_withdraw_works_while_paused() public {
        vm.prank(user);
        treasury.depositAvaxForXbgl{value: 1 ether}(0);
        treasury.pause();
        uint256 beforeBal = owner.balance;
        treasury.withdrawAVAX(payable(owner), 1 ether);
        assertEq(owner.balance, beforeBal + 1 ether);
    }

    function test_nonOwner_cannot_pause() public {
        vm.prank(stranger);
        vm.expectRevert();
        treasury.pause();
        vm.prank(stranger);
        vm.expectRevert();
        land.pause();
    }

    function test_pause_blocks_avax_buy_and_receive() public {
        land.setPhase1Prices(0.01 ether, 100 ether);
        land.pause();
        vm.prank(user);
        vm.expectRevert();
        land.buyPlotWithAVAX{value: 0.01 ether}(9);

        treasury.pause();
        vm.prank(user);
        (bool ok,) = address(treasury).call{value: 0.1 ether}("");
        assertFalse(ok);
    }

    function test_pause_blocks_depositERC20() public {
        treasury.pause();
        vm.startPrank(user);
        xbgl.approve(address(treasury), 1 ether);
        vm.expectRevert();
        treasury.depositERC20(address(xbgl), 1 ether);
        vm.stopPrank();
    }

    function test_buy_works_when_unpaused() public {
        vm.startPrank(user);
        xbgl.approve(address(land), 100 ether);
        land.buyPlotWithUSDC(7, 100 ether);
        vm.stopPrank();
        assertEq(land.balanceOf(user, 7), 1);
        assertTrue(land.plotMinted(7));
    }
}
