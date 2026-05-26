// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/SaraktTreasury.sol";

contract AvaxDepositTest is Test {
    XBGLToken internal xbgl;
    SaraktTreasury internal treasury;
    address internal user = address(0xBEEF);

    function setUp() public {
        xbgl = new XBGLToken(address(this), address(this));
        address[] memory tokens = new address[](1);
        tokens[0] = address(xbgl);
        treasury = new SaraktTreasury(tokens);
        treasury.setXbglToken(address(xbgl));
        treasury.setXbglPerAvax(20 ether); // 20 xBGL per 1 AVAX
        xbgl.transfer(address(treasury), 1_000_000 ether);
        vm.deal(user, 100 ether);
    }

    function test_depositAvaxForXbgl() public {
        vm.prank(user);
        treasury.depositAvaxForXbgl{value: 1 ether}(19 ether);
        assertEq(xbgl.balanceOf(user), 20 ether);
        assertEq(address(treasury).balance, 1 ether);
    }

    function test_revert_slippage() public {
        vm.prank(user);
        vm.expectRevert("slippage");
        treasury.depositAvaxForXbgl{value: 1 ether}(21 ether);
    }
}
