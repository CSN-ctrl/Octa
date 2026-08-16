// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IPlotPurchaseSink.sol";

/**
 * @title SaraktTreasury
 * @notice Holds AVAX / xBGL and registers plot purchases from SaraktLandV2.
 * @dev Ownable2Step + Pausable. Owner withdrawals remain available while paused (emergency drain).
 */
contract SaraktTreasury is Ownable2Step, Pausable, ReentrancyGuard, IPlotPurchaseSink {
    using SafeERC20 for IERC20;
    struct PlotRecord {
        address buyer;
        uint256 pricePaid;
        address paymentToken;
        uint256 registeredAt;
        bool registered;
    }

    mapping(address => bool) public supportedTokens;
    mapping(uint256 => PlotRecord) public plots;

    address public landContract;
    address public xbglToken;
    /// @dev xBGL (18 dec) credited per 1 AVAX wei (18 dec): xbglOut = avaxWei * xbglPerAvaxE18 / 1e18
    uint256 public xbglPerAvaxE18;

    event DepositAVAX(address indexed from, uint256 amount);
    event AvaxSwappedForXbgl(address indexed buyer, uint256 avaxIn, uint256 xbglOut);
    event XbglPerAvaxUpdated(uint256 xbglPerAvaxE18);
    event DepositERC20(address indexed from, address indexed token, uint256 amount);
    event WithdrawalAVAX(address indexed to, uint256 amount);
    event WithdrawalERC20(address indexed to, address indexed token, uint256 amount);
    event PlotRegistered(
        uint256 indexed plotId, address indexed buyer, uint256 pricePaid, address indexed paymentToken
    );
    event LandContractUpdated(address indexed land);
    event XbglTokenUpdated(address indexed token);
    event SupportedTokenUpdated(address indexed token, bool supported);

    constructor(address[] memory _tokens) Ownable(msg.sender) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_tokens[i] != address(0)) {
                supportedTokens[_tokens[i]] = true;
            }
        }
    }

    receive() external payable whenNotPaused {
        emit DepositAVAX(msg.sender, msg.value);
    }

    modifier onlyLand() {
        require(msg.sender == landContract, "not land");
        _;
    }

    function setLandContract(address land) external onlyOwner {
        require(land != address(0), "land=0");
        landContract = land;
        emit LandContractUpdated(land);
    }

    function setXbglToken(address token) external onlyOwner {
        require(token != address(0), "token=0");
        xbglToken = token;
        supportedTokens[token] = true;
        emit XbglTokenUpdated(token);
        emit SupportedTokenUpdated(token, true);
    }

    /// @notice Set AVAX→xBGL swap rate (owner updates from off-chain EUR/USD bridge).
    function setXbglPerAvax(uint256 rateE18) external onlyOwner {
        require(rateE18 > 0, "rate=0");
        xbglPerAvaxE18 = rateE18;
        emit XbglPerAvaxUpdated(rateE18);
    }

    function quoteXbglForAvax(uint256 avaxWei) public view returns (uint256) {
        if (avaxWei == 0 || xbglPerAvaxE18 == 0) return 0;
        return (avaxWei * xbglPerAvaxE18) / 1e18;
    }

    /// @notice Send AVAX; receive xBGL from treasury inventory (no off-chain ledger).
    function depositAvaxForXbgl(uint256 minXbglOut) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "avax=0");
        require(xbglToken != address(0), "xbgl unset");
        require(xbglPerAvaxE18 > 0, "rate unset");
        uint256 xbglOut = quoteXbglForAvax(msg.value);
        require(xbglOut >= minXbglOut, "slippage");
        IERC20(xbglToken).safeTransfer(msg.sender, xbglOut);
        emit AvaxSwappedForXbgl(msg.sender, msg.value, xbglOut);
    }

    function setSupportedToken(address token, bool supported) external onlyOwner {
        require(token != address(0), "token=0");
        supportedTokens[token] = supported;
        emit SupportedTokenUpdated(token, supported);
    }

    /// @inheritdoc IPlotPurchaseSink
    function registerPlotPurchase(uint256 plotId, address buyer, uint256 amount, address paymentToken)
        external
        onlyLand
    {
        require(buyer != address(0), "buyer=0");
        require(!plots[plotId].registered, "already registered");

        plots[plotId] = PlotRecord({
            buyer: buyer,
            pricePaid: amount,
            paymentToken: paymentToken,
            registeredAt: block.timestamp,
            registered: true
        });

        emit PlotRegistered(plotId, buyer, amount, paymentToken);
    }

    function depositERC20(address token, uint256 amount) external whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount > 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit DepositERC20(msg.sender, token, amount);
    }

    /// @notice Emergency AVAX drain — remains available while paused.
    function withdrawAVAX(address payable to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient AVAX");
        (bool success,) = to.call{value: amount}("");
        require(success, "AVAX withdrawal failed");
        emit WithdrawalAVAX(to, amount);
    }

    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawalERC20(to, token, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function balanceAVAX() external view returns (uint256) {
        return address(this).balance;
    }

    function balanceERC20(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function isPlotRegistered(uint256 plotId) external view returns (bool) {
        return plots[plotId].registered;
    }

    function getPlotRecord(uint256 plotId)
        external
        view
        returns (address buyer, uint256 pricePaid, address paymentToken, uint256 registeredAt, bool registered)
    {
        PlotRecord memory r = plots[plotId];
        return (r.buyer, r.pricePaid, r.paymentToken, r.registeredAt, r.registered);
    }
}
