// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// RPC client for interacting with ChaosStarVM

package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// RPCClient handles JSON-RPC communication
type RPCClient struct {
	endpoint string
	client   *http.Client
	id       int
}

// RPCRequest represents a JSON-RPC request
type RPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      int         `json:"id"`
}

// RPCResponse represents a JSON-RPC response
type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
	ID      int             `json:"id"`
}

// RPCError represents a JSON-RPC error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *RPCError) Error() string {
	return fmt.Sprintf("RPC Error %d: %s", e.Code, e.Message)
}

// NewRPCClient creates a new RPC client
func NewRPCClient(endpoint string) *RPCClient {
	return &RPCClient{
		endpoint: endpoint,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		id: 0,
	}
}

// Call makes an RPC call
func (c *RPCClient) Call(method string, params interface{}, result interface{}) error {
	c.id++
	
	reqBody := RPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      c.id,
	}

	reqData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.client.Post(c.endpoint, "application/json", bytes.NewReader(reqData))
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var rpcResp RPCResponse
	if err := json.Unmarshal(respData, &rpcResp); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if rpcResp.Error != nil {
		return rpcResp.Error
	}

	if result != nil && rpcResp.Result != nil {
		if err := json.Unmarshal(rpcResp.Result, result); err != nil {
			return fmt.Errorf("failed to unmarshal result: %w", err)
		}
	}

	return nil
}

// GetRPCClient returns an RPC client with the configured endpoint
func GetRPCClient() *RPCClient {
	cfg := GetConfig()
	return NewRPCClient(cfg.RPCEndpoint)
}

// Network info response
type NetworkInfo struct {
	NetworkID uint32 `json:"networkId"`
	SubnetID  string `json:"subnetId"`
	ChainID   string `json:"chainId"`
}

// Ping checks if the chain is responsive
func (c *RPCClient) Ping() (bool, error) {
	var result struct {
		Success bool `json:"success"`
	}
	err := c.Call("hypersdk.ping", nil, &result)
	if err != nil {
		return false, err
	}
	return result.Success, nil
}

// GetNetwork gets network information
func (c *RPCClient) GetNetwork() (*NetworkInfo, error) {
	var result NetworkInfo
	err := c.Call("hypersdk.network", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// GetBalance gets balance for an address and token type
func (c *RPCClient) GetBalance(address string, tokenType uint8) (uint64, error) {
	var result struct {
		Balance string `json:"balance"`
	}
	params := map[string]interface{}{
		"address":   address,
		"tokenType": tokenType,
	}
	err := c.Call("hypersdk.getBalance", params, &result)
	if err != nil {
		return 0, err
	}
	
	var balance uint64
	fmt.Sscanf(result.Balance, "%d", &balance)
	return balance, nil
}

// GetLastAccepted gets the last accepted block
func (c *RPCClient) GetLastAccepted() (*BlockInfo, error) {
	var result BlockInfo
	err := c.Call("hypersdk.lastAccepted", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// BlockInfo represents block information
type BlockInfo struct {
	Height    uint64 `json:"height"`
	Timestamp int64  `json:"timestamp"`
	BlockID   string `json:"blockId"`
}

// SubmitTx submits a signed transaction
func (c *RPCClient) SubmitTx(txBytes []byte) (string, error) {
	var result struct {
		TxID string `json:"txId"`
	}
	params := map[string]interface{}{
		"tx": txBytes,
	}
	err := c.Call("hypersdk.submitTx", params, &result)
	if err != nil {
		return "", err
	}
	return result.TxID, nil
}

// GetTxStatus gets transaction status
func (c *RPCClient) GetTxStatus(txID string) (*TxStatus, error) {
	var result TxStatus
	params := map[string]interface{}{
		"txId": txID,
	}
	err := c.Call("hypersdk.getTxStatus", params, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// TxStatus represents transaction status
type TxStatus struct {
	Confirmed bool   `json:"confirmed"`
	Success   bool   `json:"success,omitempty"`
	Error     string `json:"error,omitempty"`
}

// GetSuggestedFee gets suggested fee
func (c *RPCClient) GetSuggestedFee() (uint64, error) {
	var result struct {
		Fee string `json:"fee"`
	}
	err := c.Call("hypersdk.suggestedFee", nil, &result)
	if err != nil {
		return 1000, nil // Default fee
	}
	
	var fee uint64
	fmt.Sscanf(result.Fee, "%d", &fee)
	return fee, nil
}

