// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function depositERC20(address token, uint256 amount) external;
    receive() external payable;
}

interface IDigitalID {
    function ids(address user) external view returns (
        string memory username, string memory emailHash, uint256 registeredAt, bool active
    );
}

contract SaraktLandV2 is ERC1155, Ownable, ReentrancyGuard {
    uint256 public constant TOTAL_PLOTS = 10000;
    uint256 public plotsSold = 0;
    uint256 public priceInAVAX = 0.5 ether;

    ITreasury public treasury;
    IDigitalID public digitalID;
    bool public salesActive = false;

    mapping(uint256 => bool) public plotMinted;

    event LandMinted(
        uint256 indexed plotId,
        address indexed owner,
        uint256 pricePaid,
        bool coldWallet,
        uint256 timestamp
    );

    constructor(address _treasury, address _digitalID) ERC1155("ipfs://QmSarakt/{id}.json") {
        require(_treasury != address(0), "Invalid treasury");
        require(_digitalID != address(0), "Invalid digitalID");
        treasury = ITreasury(_treasury);
        digitalID = IDigitalID(_digitalID);
    }

    function buyPlot(uint256 plotId) external payable nonReentrant {
        _buy(plotId, msg.sender, false, msg.value, true);
    }
    function buyPlotsBatch(uint256[] calldata plotIds) external payable nonReentrant {
    require(salesActive, "Sales not active");
    require(plotIds.length > 0, "No plots selected");
    
    uint256 totalPrice = priceInAVAX * plotIds.length;
    require(msg.value >= totalPrice, "Insufficient AVAX");

    (, , , bool active) = digitalID.ids(msg.sender);
    require(active, "Digital ID required");

    for (uint i = 0; i < plotIds.length; i++) {
        uint256 plotId = plotIds[i];
        require(plotId > 0 && plotId <= TOTAL_PLOTS, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");

        plotMinted[plotId] = true;
        plotsSold++;
        _mint(msg.sender, plotId, 1, "");
        emit LandMinted(plotId, msg.sender, priceInAVAX, false, block.timestamp);
    }

    // Refund excess AVAX
    uint256 excess = msg.value - totalPrice;
    if (excess > 0) {
        (bool refunded, ) = msg.sender.call{value: excess}("");
        require(refunded, "Refund failed");
    }

    // Transfer payment to treasury
    (bool success, ) = address(treasury).call{value: totalPrice}("");
    require(success, "Treasury deposit failed");   
    }



    function buyPlotForCold(uint256 plotId, address coldWallet) external payable nonReentrant {
        require(coldWallet != address(0), "Invalid cold wallet");
        _buy(plotId, coldWallet, true, msg.value, true);
    }

    function buyPlotERC20(uint256 plotId, address token, uint256 amount, address recipient) external nonReentrant {
        require(salesActive, "Sales not active");
        require(plotId > 0 && plotId <= TOTAL_PLOTS, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");
        require(amount > 0, "Amount > 0");

        (, , , bool active) = digitalID.ids(msg.sender);
        require(active, "Digital ID required");

        plotMinted[plotId] = true;
        plotsSold++;
        _mint(recipient, plotId, 1, "");

        treasury.depositERC20(token, amount);

        emit LandMinted(plotId, recipient, amount, false, block.timestamp);
    }

    function _buy(uint256 plotId, address recipient, bool coldWallet, uint256 value, bool requireID) internal {
        require(salesActive, "Sales not active");
        require(plotId > 0 && plotId <= TOTAL_PLOTS, "Invalid plot");
        require(!plotMinted[plotId], "Already sold");
        if (requireID) {
            (, , , bool active) = digitalID.ids(msg.sender);
            require(active, "Digital ID required");
        }

        plotMinted[plotId] = true;
        plotsSold++;
        _mint(recipient, plotId, 1, "");

        (bool success, ) = address(treasury).call{value: value}("");
        require(success, "Treasury deposit failed");

        emit LandMinted(plotId, recipient, value, coldWallet, block.timestamp);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        priceInAVAX = newPrice;
    }

    function toggleSales(bool active) external onlyOwner {
        salesActive = active;
    }

    function plotsRemaining() external view returns (uint256) {
        return TOTAL_PLOTS - plotsSold;
    }
}
