// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate Chain Adapters for Cross-Chain Operations

package stargate

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"
)

// ChainAdapter interface for external chain interactions
type ChainAdapter interface {
	Name() string
	ChainID() uint64
	GetBalance(address string) (*big.Int, error)
	GetTokenBalance(address string, tokenAddress string) (*big.Int, error)
	SendTransaction(tx *Transaction) (*TxResult, error)
	GetTransactionReceipt(txHash string) (*TxResult, error)
	EstimateGas(tx *Transaction) (uint64, error)
}

// EVMAdapter implements ChainAdapter for EVM-compatible chains
type EVMAdapter struct {
	name     string
	chainID  uint64
	endpoint string
	client   *http.Client
}

// NewEVMAdapter creates a new EVM chain adapter
func NewEVMAdapter(name string, chainID uint64, endpoint string) *EVMAdapter {
	return &EVMAdapter{
		name:     name,
		chainID:  chainID,
		endpoint: endpoint,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (a *EVMAdapter) Name() string {
	return a.name
}

func (a *EVMAdapter) ChainID() uint64 {
	return a.chainID
}

func (a *EVMAdapter) call(method string, params interface{}) (json.RawMessage, error) {
	reqBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  method,
		"params":  params,
		"id":      1,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := a.client.Post(a.endpoint, "application/json", bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("RPC call failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Error != nil {
		return nil, fmt.Errorf(result.Error.Message)
	}

	return result.Result, nil
}

func (a *EVMAdapter) GetBalance(address string) (*big.Int, error) {
	result, err := a.call("eth_getBalance", []interface{}{address, "latest"})
	if err != nil {
		return nil, err
	}

	var hexBalance string
	if err := json.Unmarshal(result, &hexBalance); err != nil {
		return nil, err
	}

	balance := new(big.Int)
	if len(hexBalance) > 2 {
		balance.SetString(hexBalance[2:], 16)
	}

	return balance, nil
}

func (a *EVMAdapter) GetTokenBalance(address string, tokenAddress string) (*big.Int, error) {
	// Build ERC-20 balanceOf call
	// balanceOf(address) = 0x70a08231 + padded address
	paddedAddr := fmt.Sprintf("%064s", address[2:])
	data := "0x70a08231" + paddedAddr

	result, err := a.call("eth_call", []interface{}{
		map[string]interface{}{
			"to":   tokenAddress,
			"data": data,
		},
		"latest",
	})
	if err != nil {
		return nil, err
	}

	var hexBalance string
	if err := json.Unmarshal(result, &hexBalance); err != nil {
		return nil, err
	}

	balance := new(big.Int)
	if len(hexBalance) > 2 {
		balance.SetString(hexBalance[2:], 16)
	}

	return balance, nil
}

func (a *EVMAdapter) SendTransaction(tx *Transaction) (*TxResult, error) {
	// Build transaction object
	txObj := map[string]interface{}{
		"from":  tx.From,
		"to":    tx.To,
		"value": fmt.Sprintf("0x%x", tx.Value),
	}

	if tx.Data != "" {
		txObj["data"] = tx.Data
	}

	result, err := a.call("eth_sendTransaction", []interface{}{txObj})
	if err != nil {
		return nil, err
	}

	var txHash string
	if err := json.Unmarshal(result, &txHash); err != nil {
		return nil, err
	}

	return &TxResult{
		Success: true,
		Hash:    txHash,
	}, nil
}

func (a *EVMAdapter) GetTransactionReceipt(txHash string) (*TxResult, error) {
	result, err := a.call("eth_getTransactionReceipt", []interface{}{txHash})
	if err != nil {
		return nil, err
	}

	if result == nil || string(result) == "null" {
		return nil, fmt.Errorf("transaction not found")
	}

	var receipt struct {
		Status      string `json:"status"`
		BlockNumber string `json:"blockNumber"`
		GasUsed     string `json:"gasUsed"`
	}

	if err := json.Unmarshal(result, &receipt); err != nil {
		return nil, err
	}

	var blockNum uint64
	fmt.Sscanf(receipt.BlockNumber, "0x%x", &blockNum)

	var gasUsed uint64
	fmt.Sscanf(receipt.GasUsed, "0x%x", &gasUsed)

	return &TxResult{
		Success:     receipt.Status == "0x1",
		Hash:        txHash,
		BlockNumber: blockNum,
		GasUsed:     gasUsed,
	}, nil
}

func (a *EVMAdapter) EstimateGas(tx *Transaction) (uint64, error) {
	txObj := map[string]interface{}{
		"from": tx.From,
		"to":   tx.To,
	}

	if tx.Value != nil {
		txObj["value"] = fmt.Sprintf("0x%x", tx.Value)
	}

	if tx.Data != "" {
		txObj["data"] = tx.Data
	}

	result, err := a.call("eth_estimateGas", []interface{}{txObj})
	if err != nil {
		return 21000, nil // Default gas
	}

	var hexGas string
	if err := json.Unmarshal(result, &hexGas); err != nil {
		return 21000, nil
	}

	var gas uint64
	fmt.Sscanf(hexGas, "0x%x", &gas)

	return gas, nil
}

// ============================================================================
// Bridge Manager
// ============================================================================

// BridgeManager handles cross-chain token bridges
type BridgeManager struct {
	adapters map[string]ChainAdapter
	treasury *TreasuryModule
}

func NewBridgeManager(adapters map[string]ChainAdapter, treasury *TreasuryModule) *BridgeManager {
	return &BridgeManager{
		adapters: adapters,
		treasury: treasury,
	}
}

// BridgeToken bridges tokens from ChaosStar to external chain
func (bm *BridgeManager) BridgeOut(
	from string,
	targetChain string,
	targetAddress string,
	tokenType uint8,
	amount uint64,
) (*TxResult, error) {
	adapter, ok := bm.adapters[targetChain]
	if !ok {
		return nil, fmt.Errorf("unsupported chain: %s", targetChain)
	}

	// 1. Lock tokens in treasury
	_, err := bm.treasury.Deposit(from, tokenType, amount)
	if err != nil {
		return nil, fmt.Errorf("failed to lock tokens: %w", err)
	}

	// 2. Mint wrapped tokens on target chain
	// This would interact with a bridge contract on the target chain
	tx := &Transaction{
		From:   from,
		To:     targetAddress,
		Value:  big.NewInt(int64(amount)),
		Action: "bridgeMint",
	}

	result, err := adapter.SendTransaction(tx)
	if err != nil {
		// TODO: Implement rollback
		return nil, fmt.Errorf("failed to mint on target chain: %w", err)
	}

	return result, nil
}

// BridgeIn bridges tokens from external chain to ChaosStar
func (bm *BridgeManager) BridgeIn(
	sourceChain string,
	sourceAddress string,
	targetAddress string,
	tokenType uint8,
	amount uint64,
) (*TxResult, error) {
	// This would be called when tokens are burned on the source chain
	// and need to be released on ChaosStar

	// For now, just create a placeholder result
	return &TxResult{
		Success: true,
		Hash:    generateTxHash(),
	}, nil
}

