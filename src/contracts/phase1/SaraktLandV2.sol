// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./IPlotPurchaseSink.sol";

interface ITreasury {
    function depositERC20(address token, uint256 amount) external;
    receive() external payable;
}

interface IDigitalID {
    function ids(address user) external view returns (string memory username, string memory emailHash, uint256 registeredAt, bool active);
}

interface IPlotResetSink {
    function adminClearPlotRecord(uint256 plotId) external;
}

/// @notice Phase 1 land sales (ERC-1155). Ownable2Step + Pausable for Fuji ops hardening.
/// @dev `requireDigitalID` stays false for Phase 1 (identity off-chain).
contract SaraktLandV2 is ERC1155, Ownable2Step, Pausable, ReentrancyGuard {
    uint256 public plotsSold = 0;
    uint256 public priceInAVAX = 0.5 ether;
    uint256 public phase1PriceAVAX = 0.5 ether;
    uint256 public phase1PriceUSDC = 0;

    ITreasury public treasury;
    IDigitalID public digitalID;
    bool public salesActive = false;
    bool public requireDigitalID = false;

    mapping(uint256 => bool) public plotMinted;
    mapping(uint256 => address) public pendingBuyer;

    address payable public reserveTreasury;
    address payable public operationalTreasury;
    address public usdcToken;
    address public plotRegistrar;

    event LandMinted(uint256 indexed plotId, address indexed owner, uint256 pricePaid, bool coldWallet, uint256 timestamp);
    event PlotPurchasePending(
        uint256 indexed plotId, address indexed buyer, uint256 amount, address paymentToken, uint256 timestamp
    );
    event PlotReset(uint256 indexed plotId, address indexed holder, address indexed operator);
    event PlotGranted(uint256 indexed plotId, address indexed to, address indexed operator);
    event PendingBuyerCleared(uint256 indexed plotId, address indexed previousBuyer, address indexed operator);

    constructor(address _treasury, address _digitalID) ERC1155("ipfs://QmSarakt/{id}.json") Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        require(_digitalID != address(0), "Invalid digitalID");
        treasury = ITreasury(payable(_treasury));
        digitalID = IDigitalID(_digitalID);
        reserveTreasury = payable(msg.sender);
        operationalTreasury = payable(msg.sender);
    }

    function buyPlotWithAVAX(uint256 plotId) external payable nonReentrant whenNotPaused {
        require(salesActive, "Sales not active");
        require(plotId > 0, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");
        require(pendingBuyer[plotId] == address(0), "Activation pending");
        if (requireDigitalID) {
            (,,, bool active) = digitalID.ids(msg.sender);
            require(active, "Digital ID required");
        }
        require(phase1PriceAVAX > 0, "Price not set");
        require(msg.value >= phase1PriceAVAX, "Insufficient AVAX");

        uint256 excess = msg.value - phase1PriceAVAX;
        if (excess > 0) {
            (bool refunded,) = msg.sender.call{value: excess}("");
            require(refunded, "Refund failed");
        }

        uint256 reserveAmount = (phase1PriceAVAX * 33) / 100;
        uint256 operationalAmount = phase1PriceAVAX - reserveAmount;

        require(reserveTreasury != address(0) && operationalTreasury != address(0), "Treasury not set");

        (bool s1,) = reserveTreasury.call{value: reserveAmount}("");
        require(s1, "Reserve transfer failed");
        (bool s2,) = operationalTreasury.call{value: operationalAmount}("");
        require(s2, "Operational transfer failed");

        _notifyPlotRegistrar(plotId, msg.sender, phase1PriceAVAX, address(0));
        _finalizeAndMintPlot(plotId, msg.sender, phase1PriceAVAX, address(0));
    }

    function activatePlot(uint256 plotId, address recipient) external onlyOwner nonReentrant {
        require(plotId > 0, "Invalid plot");
        require(!plotMinted[plotId], "Already minted");
        address buyer = pendingBuyer[plotId];
        require(buyer != address(0) || recipient != address(0), "No pending buyer");

        address finalRecipient = recipient != address(0) ? recipient : buyer;
        plotMinted[plotId] = true;
        pendingBuyer[plotId] = address(0);
        plotsSold++;
        _mint(finalRecipient, plotId, 1, "");
        emit LandMinted(plotId, finalRecipient, 0, false, block.timestamp);
    }

    function setPhase1Prices(uint256 avaxWei, uint256 usdcAmount) external onlyOwner {
        phase1PriceAVAX = avaxWei;
        phase1PriceUSDC = usdcAmount;
    }

    function setUSDC(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        usdcToken = token;
    }

    function setPlotRegistrar(address registrar) external onlyOwner {
        plotRegistrar = registrar;
    }

    /// @notice Pay for a plot in ERC-20 xBGL (configure token via setUSDC + phase1PriceUSDC).
    function buyPlotWithUSDC(uint256 plotId, uint256 amount) external nonReentrant whenNotPaused {
        require(salesActive, "Sales not active");
        require(plotId > 0, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");
        require(pendingBuyer[plotId] == address(0), "Activation pending");
        if (requireDigitalID) {
            (,,, bool active) = digitalID.ids(msg.sender);
            require(active, "Digital ID required");
        }
        require(usdcToken != address(0), "Payment token not set");
        require(phase1PriceUSDC > 0, "xBGL price not set");
        require(amount >= phase1PriceUSDC, "Insufficient xBGL");

        IERC20(usdcToken).transferFrom(msg.sender, address(this), amount);

        uint256 reserveAmount = (phase1PriceUSDC * 33) / 100;
        uint256 operationalAmount = phase1PriceUSDC - reserveAmount;

        require(reserveTreasury != address(0) && operationalTreasury != address(0), "Treasury not set");

        IERC20(usdcToken).transfer(reserveTreasury, reserveAmount);
        IERC20(usdcToken).transfer(operationalTreasury, operationalAmount);

        uint256 excess = amount - phase1PriceUSDC;
        if (excess > 0) {
            IERC20(usdcToken).transfer(msg.sender, excess);
        }

        _notifyPlotRegistrar(plotId, msg.sender, phase1PriceUSDC, usdcToken);
        _finalizeAndMintPlot(plotId, msg.sender, phase1PriceUSDC, usdcToken);
    }

    /// @dev Mints ERC-1155 plot NFT to buyer immediately after payment.
    function _finalizeAndMintPlot(
        uint256 plotId,
        address buyer,
        uint256 pricePaid,
        address paymentToken
    ) internal {
        require(buyer != address(0), "Invalid buyer");
        require(!plotMinted[plotId], "Already minted");
        plotMinted[plotId] = true;
        pendingBuyer[plotId] = address(0);
        plotsSold++;
        _mint(buyer, plotId, 1, "");
        emit PlotPurchasePending(plotId, buyer, pricePaid, paymentToken, block.timestamp);
        emit LandMinted(plotId, buyer, pricePaid, false, block.timestamp);
    }

    function _notifyPlotRegistrar(uint256 plotId, address buyer, uint256 amount, address paymentToken) internal {
        if (plotRegistrar == address(0)) return;
        IPlotPurchaseSink(plotRegistrar).registerPlotPurchase(plotId, buyer, amount, paymentToken);
    }

    function setTreasuryRouting(address payable reserveAddr, address payable operationalAddr) external onlyOwner {
        require(reserveAddr != address(0) && operationalAddr != address(0), "Invalid addresses");
        reserveTreasury = reserveAddr;
        operationalTreasury = operationalAddr;
    }

    function toggleSales(bool active) external onlyOwner {
        salesActive = active;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Fuji / Anvil / Hardhat local — never Avalanche C-Chain mainnet (43114).
    function _requireTestnet() internal view {
        require(
            block.chainid == 43_113 || block.chainid == 1_337 || block.chainid == 31_337,
            "testnet only"
        );
    }

    /// @notice Fuji/local testnet only: burn plot NFT and free id for resale. Call while paused.
    /// @dev Also clears treasury registry when plotRegistrar supports adminClearPlotRecord.
    function adminResetPlot(uint256 plotId, address holder) external onlyOwner whenPaused {
        _requireTestnet();
        require(plotId > 0, "Invalid plot");
        require(plotMinted[plotId], "Not minted");
        require(holder != address(0), "holder=0");
        require(balanceOf(holder, plotId) > 0, "holder balance=0");

        _burn(holder, plotId, 1);
        plotMinted[plotId] = false;
        pendingBuyer[plotId] = address(0);
        if (plotsSold > 0) {
            plotsSold -= 1;
        }

        if (plotRegistrar != address(0)) {
            // optional clear — ignore if registrar has no clear (legacy)
            try IPlotResetSink(plotRegistrar).adminClearPlotRecord(plotId) {} catch {}
        }

        emit PlotReset(plotId, holder, msg.sender);
    }

    /// @notice Fuji/local only: mint a plot for free (no payment). For staging QA loops.
    /// @dev Registers treasury at zero price when plotRegistrar is set. Does not require pause.
    function adminGrantPlot(address to, uint256 plotId) external onlyOwner nonReentrant {
        _requireTestnet();
        require(to != address(0), "to=0");
        require(plotId > 0, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");
        require(pendingBuyer[plotId] == address(0), "Activation pending");

        _notifyPlotRegistrar(plotId, to, 0, address(0));
        _finalizeAndMintPlot(plotId, to, 0, address(0));
        emit PlotGranted(plotId, to, msg.sender);
    }

    /// @notice Fuji/local only: clear a stuck pendingBuyer so the plot can be sold/granted again.
    function adminClearPendingBuyer(uint256 plotId) external onlyOwner {
        _requireTestnet();
        require(plotId > 0, "Invalid plot");
        address previous = pendingBuyer[plotId];
        require(previous != address(0), "no pending");
        pendingBuyer[plotId] = address(0);
        emit PendingBuyerCleared(plotId, previous, msg.sender);
    }

    /// @notice Updates the ERC-1155 metadata template (must contain `{id}` per EIP-1155).
    function setMetadataURI(string calldata newuri) external onlyOwner {
        _setURI(newuri);
    }
}
