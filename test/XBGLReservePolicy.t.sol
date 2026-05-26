// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/contracts/phase1/ReserveMintController.sol";
import "../src/contracts/phase1/XBGLToken.sol";

contract XBGLReservePolicyTest is Test {
    XBGLToken internal xbgl;
    ReserveMintController internal controller;

    address internal admin = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal recipient = address(0xCAFE);
    address internal outsider = address(0xDEAD);

    uint256 internal constant RESERVE_SHARE_BPS = 3_000;
    uint256 internal constant COOLDOWN = 7 days;
    uint256 internal constant K_E18 = 2 ether;
    uint256 internal constant MAX_CYCLE = 1_000_000 ether;

    function setUp() public {
        vm.startPrank(admin);
        xbgl = new XBGLToken(admin, treasury);
        controller = new ReserveMintController(
            admin, address(xbgl), RESERVE_SHARE_BPS, COOLDOWN, K_E18, MAX_CYCLE
        );
        xbgl.grantRole(xbgl.MINTER_ROLE(), address(controller));
        vm.stopPrank();
    }

    function testGenesisSupplyMatchesProtocolSpec() public {
        assertEq(xbgl.name(), "Bulgarian Reserve");
        assertEq(xbgl.symbol(), "xBGL");
        assertEq(xbgl.decimals(), 18);
        assertEq(xbgl.GENESIS_SUPPLY(), 10_000_000_000 ether);
        assertEq(xbgl.totalSupply(), xbgl.GENESIS_SUPPLY());
        assertEq(xbgl.balanceOf(treasury), xbgl.GENESIS_SUPPLY());
    }

    function testOnlyAuthorizedMinterCanMint() public {
        vm.prank(outsider);
        vm.expectRevert();
        xbgl.mint(recipient, 1 ether);

        vm.startPrank(admin);
        xbgl.grantRole(xbgl.MINTER_ROLE(), admin);
        xbgl.mint(recipient, 1 ether);
        vm.stopPrank();

        assertEq(xbgl.balanceOf(recipient), 1 ether);
    }

    function testReserveGrowthExpansionDeltaSOverK() public {
        uint256 reserveDeltaUsdE18 = 2_000 ether;
        uint256 expectedMinted = 1_000 ether; // ΔR/k = 2000/2

        assertEq(controller.quoteExpansionFromReserveDelta(reserveDeltaUsdE18), expectedMinted);

        vm.prank(admin);
        uint256 minted = controller.mintFromReserveGrowth(recipient, reserveDeltaUsdE18, keccak256("growth-1"));

        assertEq(minted, expectedMinted);
        assertEq(xbgl.balanceOf(recipient), expectedMinted);
        assertEq(controller.totalReserveGrowthUsdE18(), reserveDeltaUsdE18);
    }

    function testReserveExpansionUsesIncomeReserveShareAndEurReference() public {
        uint256 incomeEurE18 = 1_000 ether;
        uint256 reserveAllocatedEurE18 = 300 ether;
        uint256 expectedMinted = 586_749_900_000_000_000_000;
        bytes32 evidenceHash = keccak256("reserve-report-1");

        assertEq(controller.quoteReserveAllocation(incomeEurE18), reserveAllocatedEurE18);
        assertEq(controller.quoteExpansionMint(incomeEurE18), expectedMinted);

        vm.prank(admin);
        uint256 minted = controller.mintFromIncome(recipient, incomeEurE18, evidenceHash);

        assertEq(minted, expectedMinted);
        assertEq(xbgl.balanceOf(recipient), expectedMinted);
        assertEq(controller.totalIncomeReportedEurE18(), incomeEurE18);
        assertEq(controller.totalReserveAllocatedEurE18(), reserveAllocatedEurE18);
        assertEq(controller.totalExpansionMinted(), expectedMinted);
        assertTrue(controller.usedEvidenceHash(evidenceHash));
    }

    function testExpansionRejectsCycleCap() public {
        vm.prank(admin);
        vm.expectRevert(bytes("cycle cap"));
        controller.mintFromReserveGrowth(recipient, MAX_CYCLE * K_E18 + 1 ether, keccak256("too-big"));
    }

    function testReserveExpansionRejectsUnauthorizedReporter() public {
        vm.prank(outsider);
        vm.expectRevert();
        controller.mintFromIncome(recipient, 250 ether, keccak256("unauthorized-report"));
    }

    function testReserveExpansionRejectsReusedEvidenceHash() public {
        bytes32 evidenceHash = keccak256("reserve-report-1");

        vm.prank(admin);
        controller.mintFromIncome(recipient, 250 ether, evidenceHash);

        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(admin);
        vm.expectRevert(bytes("evidence used"));
        controller.mintFromIncome(recipient, 250 ether, evidenceHash);
    }

    function testReserveExpansionRequiresCooldown() public {
        vm.prank(admin);
        controller.mintFromIncome(recipient, 250 ether, keccak256("reserve-report-1"));

        vm.prank(admin);
        vm.expectRevert(bytes("cooldown"));
        controller.mintFromIncome(recipient, 250 ether, keccak256("reserve-report-2"));

        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(admin);
        controller.mintFromIncome(recipient, 250 ether, keccak256("reserve-report-3"));

        assertEq(xbgl.balanceOf(recipient), 293_374_950_000_000_000_000);
    }

    function testPauseBlocksReserveExpansion() public {
        vm.prank(admin);
        controller.pause();

        vm.prank(admin);
        vm.expectRevert();
        controller.mintFromIncome(recipient, 250 ether, keccak256("paused-report"));
    }

    function testReservePolicyValidation() public {
        vm.prank(admin);
        vm.expectRevert(bytes("share"));
        controller.setReservePolicy(0, COOLDOWN, K_E18, MAX_CYCLE);

        vm.prank(admin);
        vm.expectRevert(bytes("cooldown=0"));
        controller.setReservePolicy(RESERVE_SHARE_BPS, 0, K_E18, MAX_CYCLE);

        vm.prank(admin);
        vm.expectRevert(bytes("k range"));
        controller.setReservePolicy(RESERVE_SHARE_BPS, COOLDOWN, 1 ether, MAX_CYCLE);

        vm.prank(admin);
        controller.setReservePolicy(4_000, 30 days, 3 ether, MAX_CYCLE);

        assertEq(controller.reserveShareBps(), 4_000);
        assertEq(controller.cooldownSeconds(), 30 days);
        assertEq(controller.reserveMultiplierE18(), 3 ether);
    }
}
