// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// HyperSDK RPC Client - Direct blockchain communication

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// HyperRPCClient communicates with the HyperSDK VM
type HyperRPCClient struct {
	endpoint string
	client   *http.Client
}

// RPCRequest is a JSON-RPC request
type RPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
	ID      int         `json:"id"`
}

// RPCResponse is a JSON-RPC response
type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
}

// RPCError represents an RPC error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// NewHyperRPCClient creates a new HyperSDK RPC client
func NewHyperRPCClient(endpoint string) *HyperRPCClient {
	return &HyperRPCClient{
		endpoint: endpoint,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Call makes an RPC call to the HyperSDK VM
func (c *HyperRPCClient) Call(method string, params interface{}) (json.RawMessage, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Post(c.endpoint, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var rpcResp RPCResponse
	if err := json.Unmarshal(respBody, &rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	return rpcResp.Result, nil
}

// Ping checks if the VM is responsive
func (c *HyperRPCClient) Ping() error {
	_, err := c.Call("hypersdk.ping", nil)
	return err
}

// GetBalance retrieves token balance for an address
func (c *HyperRPCClient) GetBalance(address string, tokenType uint8) (uint64, error) {
	result, err := c.Call("hypersdk.getBalance", map[string]interface{}{
		"address":   address,
		"tokenType": tokenType,
	})
	if err != nil {
		// Return 0 if connection fails (for mock mode)
		return 0, nil
	}

	var resp struct {
		Balance string `json:"balance"`
	}
	if err := json.Unmarshal(result, &resp); err != nil {
		return 0, err
	}

	var balance uint64
	fmt.Sscanf(resp.Balance, "%d", &balance)
	return balance, nil
}

// GetPlot retrieves plot information
func (c *HyperRPCClient) GetPlot(x, y uint32) (*PlotData, error) {
	result, err := c.Call("hypersdk.getPlot", map[string]interface{}{
		"x": x,
		"y": y,
	})
	if err != nil {
		return nil, err
	}

	var plot PlotData
	if err := json.Unmarshal(result, &plot); err != nil {
		return nil, err
	}

	return &plot, nil
}

// GetNPC retrieves NPC information
func (c *HyperRPCClient) GetNPC(npcID string) (*NPCData, error) {
	result, err := c.Call("hypersdk.getNPC", map[string]interface{}{
		"npcId": npcID,
	})
	if err != nil {
		return nil, err
	}

	var npc NPCData
	if err := json.Unmarshal(result, &npc); err != nil {
		return nil, err
	}

	return &npc, nil
}

// GetCity retrieves city information
func (c *HyperRPCClient) GetCity(cityName string) (*CityData, error) {
	result, err := c.Call("hypersdk.getCity", map[string]interface{}{
		"name": cityName,
	})
	if err != nil {
		return nil, err
	}

	var city CityData
	if err := json.Unmarshal(result, &city); err != nil {
		return nil, err
	}

	return &city, nil
}

// SubmitTx submits a transaction to the VM
func (c *HyperRPCClient) SubmitTx(action string, params map[string]interface{}) (*TxResult, error) {
	params["action"] = action
	result, err := c.Call("hypersdk.submitTx", params)
	if err != nil {
		return nil, err
	}

	var txResult TxResult
	if err := json.Unmarshal(result, &txResult); err != nil {
		return nil, err
	}

	return &txResult, nil
}

// Transfer executes a token transfer
func (c *HyperRPCClient) Transfer(from, to string, tokenType uint8, amount uint64, memo string) (*TxResult, error) {
	return c.SubmitTx("transfer", map[string]interface{}{
		"from":      from,
		"to":        to,
		"tokenType": tokenType,
		"amount":    amount,
		"memo":      memo,
	})
}

// BuyPlot submits a plot purchase transaction
func (c *HyperRPCClient) BuyPlot(from string, x, y uint32, price uint64) (*TxResult, error) {
	return c.SubmitTx("buyPlot", map[string]interface{}{
		"from":  from,
		"x":     x,
		"y":     y,
		"price": price,
	})
}

// UpgradePlot submits a plot upgrade transaction
func (c *HyperRPCClient) UpgradePlot(from string, x, y uint32, newLevel uint8, cost uint64) (*TxResult, error) {
	return c.SubmitTx("upgradePlot", map[string]interface{}{
		"from":     from,
		"x":        x,
		"y":        y,
		"newLevel": newLevel,
		"cost":     cost,
	})
}

// TransferPlot submits a plot transfer transaction
func (c *HyperRPCClient) TransferPlot(from, to string, x, y uint32) (*TxResult, error) {
	return c.SubmitTx("transferPlot", map[string]interface{}{
		"from": from,
		"to":   to,
		"x":    x,
		"y":    y,
	})
}

// CreateNPC submits an NPC creation transaction
func (c *HyperRPCClient) CreateNPC(from string, npcID string, x, y uint32) (*TxResult, error) {
	return c.SubmitTx("createNPC", map[string]interface{}{
		"from":  from,
		"npcId": npcID,
		"x":     x,
		"y":     y,
	})
}

// TrainNPC submits an NPC training transaction
func (c *HyperRPCClient) TrainNPC(from, npcID string, skill string, experience uint64) (*TxResult, error) {
	return c.SubmitTx("trainNPC", map[string]interface{}{
		"from":       from,
		"npcId":      npcID,
		"skill":      skill,
		"experience": experience,
	})
}

// AssignNPC submits an NPC assignment transaction
func (c *HyperRPCClient) AssignNPC(from, npcID string, task string, x, y uint32) (*TxResult, error) {
	return c.SubmitTx("assignNPC", map[string]interface{}{
		"from":  from,
		"npcId": npcID,
		"task":  task,
		"x":     x,
		"y":     y,
	})
}

// RelocateNPC submits an NPC relocation transaction
func (c *HyperRPCClient) RelocateNPC(from, npcID string, newX, newY uint32) (*TxResult, error) {
	return c.SubmitTx("relocateNPC", map[string]interface{}{
		"from":  from,
		"npcId": npcID,
		"newX":  newX,
		"newY":  newY,
	})
}

// CreateCity submits a city creation transaction
func (c *HyperRPCClient) CreateCity(from, name string, x, y uint32) (*TxResult, error) {
	return c.SubmitTx("createCity", map[string]interface{}{
		"from": from,
		"name": name,
		"x":    x,
		"y":    y,
	})
}

// UpdateCityEconomy submits a city economy update transaction
func (c *HyperRPCClient) UpdateCityEconomy(from, cityName string, taxRate uint8) (*TxResult, error) {
	return c.SubmitTx("updateCityEconomy", map[string]interface{}{
		"from":    from,
		"name":    cityName,
		"taxRate": taxRate,
	})
}

// Swap executes a token swap
func (c *HyperRPCClient) Swap(from string, tokenIn, tokenOut uint8, amountIn, minOut uint64) (*TxResult, error) {
	return c.SubmitTx("swap", map[string]interface{}{
		"from":         from,
		"tokenIn":      tokenIn,
		"tokenOut":     tokenOut,
		"amountIn":     amountIn,
		"minAmountOut": minOut,
	})
}

// TxResult represents transaction result
type TxResult struct {
	Success bool   `json:"success"`
	TxID    string `json:"txId"`
	TxHash  string `json:"txHash"`
	Error   string `json:"error,omitempty"`
}

// StargateClient communicates with Stargate for EVM compatibility
type StargateClient struct {
	endpoint string
	client   *http.Client
}

// NewStargateClient creates a new Stargate client
func NewStargateClient(endpoint string) *StargateClient {
	return &StargateClient{
		endpoint: endpoint,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Call makes an RPC call to Stargate
func (c *StargateClient) Call(method string, params interface{}) (json.RawMessage, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Post(c.endpoint, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var rpcResp RPCResponse
	if err := json.Unmarshal(respBody, &rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("Stargate error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	return rpcResp.Result, nil
}

// GetChainID returns the chain ID from Stargate
func (c *StargateClient) GetChainID() (uint64, error) {
	result, err := c.Call("eth_chainId", nil)
	if err != nil {
		return 0, err
	}

	var chainIDStr string
	if err := json.Unmarshal(result, &chainIDStr); err != nil {
		return 0, err
	}

	var chainID uint64
	fmt.Sscanf(chainIDStr, "0x%x", &chainID)
	return chainID, nil
}

// GetBlockNumber returns the current block number
func (c *StargateClient) GetBlockNumber() (uint64, error) {
	result, err := c.Call("eth_blockNumber", nil)
	if err != nil {
		return 0, err
	}

	var blockNumStr string
	if err := json.Unmarshal(result, &blockNumStr); err != nil {
		return 0, err
	}

	var blockNum uint64
	fmt.Sscanf(blockNumStr, "0x%x", &blockNum)
	return blockNum, nil
}

// IsConnected checks if Stargate is connected
func (c *StargateClient) IsConnected() bool {
	_, err := c.GetBlockNumber()
	return err == nil
}

