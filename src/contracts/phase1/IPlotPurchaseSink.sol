// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPlotPurchaseSink {
    function registerPlotPurchase(uint256 plotId, address buyer, uint256 amount, address paymentToken) external;
}
