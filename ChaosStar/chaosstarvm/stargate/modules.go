// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate HyperVM Module Handlers

package stargate

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// BaseModule provides common functionality for all modules
type BaseModule struct {
	rpcEndpoint string
	client      *http.Client
}

func newBaseModule(rpcEndpoint string) BaseModule {
	return BaseModule{
		rpcEndpoint: rpcEndpoint,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (m *BaseModule) call(method string, params interface{}) (json.RawMessage, error) {
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

	resp, err := m.client.Post(m.rpcEndpoint, "application/json", bytes.NewReader(data))
	if err != nil {
		return nil, err
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

// ============================================================================
// Treasury Module
// ============================================================================

type TreasuryModule struct {
	BaseModule
}

func NewTreasuryModule(rpcEndpoint string) *TreasuryModule {
	return &TreasuryModule{
		BaseModule: newBaseModule(rpcEndpoint),
	}
}

func (m *TreasuryModule) GetBalance(address string, tokenType uint8) (uint64, error) {
	result, err := m.call("hypersdk.getBalance", map[string]interface{}{
		"address":   address,
		"tokenType": tokenType,
	})
	if err != nil {
		return 0, err
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

func (m *TreasuryModule) Swap(tx *Transaction) (*TxResult, error) {
	// Build swap transaction and submit to HyperVM
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action":    "swap",
		"from":      tx.From,
		"tokenIn":   tx.Params.TokenIn,
		"tokenOut":  tx.Params.TokenOut,
		"amountIn":  tx.Params.AmountIn,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

func (m *TreasuryModule) Deposit(address string, tokenType uint8, amount uint64) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action":    "treasuryDeposit",
		"address":   address,
		"tokenType": tokenType,
		"amount":    amount,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

// ============================================================================
// Token Module
// ============================================================================

type TokenModule struct {
	BaseModule
}

func NewTokenModule(rpcEndpoint string) *TokenModule {
	return &TokenModule{
		BaseModule: newBaseModule(rpcEndpoint),
	}
}

func (m *TokenModule) GetBalance(address string, tokenType uint8) (uint64, error) {
	result, err := m.call("hypersdk.getBalance", map[string]interface{}{
		"address":   address,
		"tokenType": tokenType,
	})
	if err != nil {
		return 0, err
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

func (m *TokenModule) Transfer(tx *Transaction) (*TxResult, error) {
	tokenType := tx.Params.TokenType
	if tokenType == 0 && tx.Value != nil && tx.Value.Uint64() > 0 {
		// Native transfer (xBGL)
		tx.Params.Amount = tx.Value.Uint64()
	}

	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action":    "transfer",
		"from":      tx.From,
		"to":        tx.To,
		"tokenType": tokenType,
		"amount":    tx.Params.Amount,
		"memo":      tx.Params.Memo,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

// ============================================================================
// Plot Module
// ============================================================================

type PlotModule struct {
	BaseModule
}

func NewPlotModule(rpcEndpoint string) *PlotModule {
	return &PlotModule{
		BaseModule: newBaseModule(rpcEndpoint),
	}
}

func (m *PlotModule) Get(x, y uint32) (*PlotInfo, error) {
	result, err := m.call("hypersdk.getPlot", map[string]interface{}{
		"x": x,
		"y": y,
	})
	if err != nil {
		return nil, err
	}

	var plot PlotInfo
	if err := json.Unmarshal(result, &plot); err != nil {
		return nil, err
	}

	return &plot, nil
}

func (m *PlotModule) Buy(tx *Transaction) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action": "buyPlot",
		"from":   tx.From,
		"x":      tx.Params.X,
		"y":      tx.Params.Y,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

func (m *PlotModule) Upgrade(tx *Transaction) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action": "upgradePlot",
		"from":   tx.From,
		"x":      tx.Params.X,
		"y":      tx.Params.Y,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

type PlotInfo struct {
	Owner     string `json:"owner"`
	X         uint32 `json:"x"`
	Y         uint32 `json:"y"`
	Level     uint8  `json:"level"`
	Resources map[string]uint64 `json:"resources"`
}

// ============================================================================
// NPC Module
// ============================================================================

type NPCModule struct {
	BaseModule
}

func NewNPCModule(rpcEndpoint string) *NPCModule {
	return &NPCModule{
		BaseModule: newBaseModule(rpcEndpoint),
	}
}

func (m *NPCModule) Get(npcID string) (*NPCInfo, error) {
	result, err := m.call("hypersdk.getNPC", map[string]interface{}{
		"npcId": npcID,
	})
	if err != nil {
		return nil, err
	}

	var npc NPCInfo
	if err := json.Unmarshal(result, &npc); err != nil {
		return nil, err
	}

	return &npc, nil
}

func (m *NPCModule) Create(tx *Transaction) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action": "createNPC",
		"from":   tx.From,
		"name":   tx.Params.Name,
		"x":      tx.Params.X,
		"y":      tx.Params.Y,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

func (m *NPCModule) Train(tx *Transaction) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action": "trainNPC",
		"from":   tx.From,
		"npcId":  tx.Params.NPCID,
		"skill":  tx.Params.Skill,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

type NPCInfo struct {
	ID           string `json:"id"`
	Owner        string `json:"owner"`
	Name         string `json:"name"`
	LocationX    uint32 `json:"locationX"`
	LocationY    uint32 `json:"locationY"`
	Loyalty      uint8  `json:"loyalty"`
	AssignedTask string `json:"assignedTask"`
}

// ============================================================================
// Industrial Module
// ============================================================================

type IndustrialModule struct {
	BaseModule
}

func NewIndustrialModule(rpcEndpoint string) *IndustrialModule {
	return &IndustrialModule{
		BaseModule: newBaseModule(rpcEndpoint),
	}
}

func (m *IndustrialModule) Process(tx *Transaction) (*TxResult, error) {
	result, err := m.call("hypersdk.submitTx", map[string]interface{}{
		"action": "process",
		"from":   tx.From,
		"x":      tx.Params.X,
		"y":      tx.Params.Y,
	})
	if err != nil {
		return nil, err
	}

	var resp struct {
		TxID string `json:"txId"`
	}
	json.Unmarshal(result, &resp)

	return &TxResult{
		Success: true,
		Hash:    resp.TxID,
	}, nil
}

