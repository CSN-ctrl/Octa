// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/phase1/XBGLToken.sol";
import "../src/contracts/phase1/Phase1Hub1155.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract Phase1Hub1155Test is Test {
    XBGLToken internal xbgl;
    Phase1Hub1155 internal hub;
    MockUSDC internal usdc;

    address internal admin = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal buyer = address(0xCAFE);
    address internal buyer2 = address(0xCAFF);
    address internal ops = address(0x0F05);

    uint256 internal constant RATE_E18 = 1e18; // 1 USDC => 1 xBGL

    function setUp() public {
        vm.startPrank(admin);

        xbgl = new XBGLToken(admin, admin);
        usdc = new MockUSDC();

        hub = new Phase1Hub1155(
            admin,
            address(xbgl),
            address(usdc),
            treasury,
            RATE_E18,
            10_000,
            10e6,
            10_000e6,
            100_000e6,
            100e18,
            10_000,
            "ipfs://phase1/{id}.json"
        );

        xbgl.grantRole(xbgl.MINTER_ROLE(), address(hub));
        hub.grantRole(hub.OPERATIONS_ROLE(), ops);
        hub.setPhase1Open(true);
        hub.setLandSaleOpen(true);
        hub.setRaffleOpen(true);

        vm.stopPrank();

        usdc.mint(buyer, 5_000e6);
        usdc.mint(buyer2, 5_000e6);
        vm.prank(buyer);
        usdc.approve(address(hub), type(uint256).max);
        vm.prank(buyer2);
        usdc.approve(address(hub), type(uint256).max);

        deal(address(xbgl), buyer, 1_000e18);
        vm.prank(buyer);
        IERC20(address(xbgl)).approve(address(hub), type(uint256).max);
        deal(address(xbgl), buyer2, 1_000e18);
        vm.prank(buyer2);
        IERC20(address(xbgl)).approve(address(hub), type(uint256).max);
    }

    function testDepositUSDCMintsXBGL() public {
        uint256 treasuryUSDCBefore = usdc.balanceOf(treasury);
        uint256 buyerXBGLBefore = xbgl.balanceOf(buyer);

        vm.prank(buyer);
        hub.depositUSDC(100e6, 100e18, buyer, keccak256("dep-1"));

        assertEq(usdc.balanceOf(treasury), treasuryUSDCBefore + 100e6, "treasury USDC not increased");
        assertEq(xbgl.balanceOf(buyer), buyerXBGLBefore + 100e18, "xBGL not minted");
    }

    function testRaffleFlowRequiresPlotAndSocialTasks() public {
        vm.prank(buyer);
        vm.expectRevert("need at least 1 plot");
        hub.enterRaffle();

        vm.prank(buyer);
        hub.buyPlot(1);

        vm.prank(buyer);
        vm.expectRevert("social tasks incomplete");
        hub.enterRaffle();

        vm.prank(ops);
        hub.setSocialTasksCompleted(buyer, true, keccak256("social-proof-1"));

        vm.prank(buyer);
        hub.enterRaffle();

        assertEq(hub.raffleEntriesLength(), 1, "raffle entry missing");
    }

    function testRolePermissionsAreEnforced() public {
        address outsider = address(0xDEAD);

        vm.prank(outsider);
        vm.expectRevert();
        hub.setSocialTasksCompleted(buyer, true, keccak256("unauthorized-social"));

        vm.prank(outsider);
        vm.expectRevert();
        hub.setRaffleOpen(false);

        vm.prank(outsider);
        vm.expectRevert();
        hub.pause();

        vm.prank(ops);
        hub.setSocialTasksCompleted(buyer, true, keccak256("authorized-social"));
        assertTrue(hub.socialTasksCompleted(buyer), "ops attestation failed");

        vm.prank(admin);
        hub.setRaffleOpen(false);
        assertTrue(!hub.raffleOpen(), "raffle should be closed by raffle manager/admin");

        vm.prank(admin);
        hub.pause();
        assertTrue(hub.paused(), "pause should succeed for pauser/admin");
    }

    function testEndToEndFlow() public {
        // 1) Participant deposits USDC and receives xBGL
        uint256 buyerXbglBefore = xbgl.balanceOf(buyer);
        uint256 treasuryUsdcBefore = usdc.balanceOf(treasury);

        vm.prank(buyer);
        hub.depositUSDC(250e6, 250e18, buyer, keccak256("e2e-dep-1"));

        assertEq(xbgl.balanceOf(buyer), buyerXbglBefore + 250e18, "deposit mint mismatch");
        assertEq(usdc.balanceOf(treasury), treasuryUsdcBefore + 250e6, "treasury usdc mismatch");

        // 2) Participant buys at least one plot
        vm.prank(buyer);
        hub.buyPlot(7);
        assertEq(hub.plotsOwned(buyer), 1, "plot ownership not tracked");
        assertEq(hub.balanceOf(buyer, 7), 1, "erc1155 plot not minted");

        // 3) Ops attests social tasks completion
        vm.prank(ops);
        hub.setSocialTasksCompleted(buyer, true, keccak256("x-ig-tt-3-comments"));
        assertTrue(hub.socialTasksCompleted(buyer), "social attestation missing");

        // 4) Participant enters raffle
        vm.prank(buyer);
        hub.enterRaffle();
        assertEq(hub.raffleEntriesLength(), 1, "raffle entry missing");
        assertTrue(hub.raffleEntered(buyer), "raffleEntered flag missing");

        // 5) Add second participant for random pool realism
        vm.prank(buyer2);
        hub.depositUSDC(150e6, 150e18, buyer2, keccak256("e2e-dep-2"));
        vm.prank(buyer2);
        hub.buyPlot(8);
        vm.prank(ops);
        hub.setSocialTasksCompleted(buyer2, true, keccak256("x-ig-tt-3-comments-2"));
        vm.prank(buyer2);
        hub.enterRaffle();
        assertEq(hub.raffleEntriesLength(), 2, "second raffle entry missing");

        // 6) Raffle manager/admin selects winner by index with draw reference
        vm.prank(admin);
        address winner = hub.selectRaffleWinnerByIndex(1, keccak256("draw-proof-ref"));

        assertTrue(winner == buyer || winner == buyer2, "winner not from entrants");
        assertEq(hub.raffleWinner(), winner, "raffle winner not stored");
        assertTrue(hub.raffleDrawn(), "raffle should be marked drawn");
        assertTrue(!hub.raffleOpen(), "raffle should be closed after draw");
    }
}
