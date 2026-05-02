// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate ChaosStar-specific RPC handlers

package stargate

import (
	"encoding/json"
	"fmt"
)

// ============================================================================
// ChaosStar Token Methods
// ============================================================================

// handleGetTokenBalance handles chaosstar_getTokenBalance
func (sg *Stargate) handleGetTokenBalance(params json.RawMessage) (interface{}, *RPCError) {
	var arr []interface{}
	if err := json.Unmarshal(params, &arr); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	if len(arr) < 2 {
		return nil, &RPCError{Code: -32602, Message: "Missing parameters"}
	}

	address, ok := arr[0].(string)
	if !ok {
		return nil, &RPCError{Code: -32602, Message: "Invalid address"}
	}

	tokenTypeFloat, ok := arr[1].(float64)
	if !ok {
		return nil, &RPCError{Code: -32602, Message: "Invalid token type"}
	}
	tokenType := uint8(tokenTypeFloat)

	balance, err := sg.tokens.GetBalance(address, tokenType)
	if err != nil {
		return nil, &RPCError{Code: -32000, Message: err.Error()}
	}

	tokenName := "xBGL"
	switch tokenType {
	case TokenChaos:
		tokenName = "CHAOS"
	case TokenXen:
		tokenName = "XEN"
	}

	return map[string]interface{}{
		"balance":   fmt.Sprintf("%d", balance),
		"formatted": formatBalance(balance, 9),
		"token":     tokenName,
		"tokenType": tokenType,
	}, nil
}

// handleTransfer handles chaosstar_transfer
func (sg *Stargate) handleTransfer(params json.RawMessage) (interface{}, *RPCError) {
	var txParams struct {
		From      string `json:"from"`
		To        string `json:"to"`
		Amount    uint64 `json:"amount"`
		TokenType uint8  `json:"tokenType"`
		Memo      string `json:"memo,omitempty"`
	}

	if err := json.Unmarshal(params, &txParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	tx := &Transaction{
		Hash:   generateTxHash(),
		From:   txParams.From,
		To:     txParams.To,
		Type:   TxTypeNative,
		Action: "transfer",
		Status: TxStatusPending,
		Params: TxParams{
			TokenType: txParams.TokenType,
			Amount:    txParams.Amount,
			Memo:      txParams.Memo,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"txHash": tx.Hash,
			"status": "pending",
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// handleSwap handles chaosstar_swap
func (sg *Stargate) handleSwap(params json.RawMessage) (interface{}, *RPCError) {
	var swapParams struct {
		From      string `json:"from"`
		TokenIn   uint8  `json:"tokenIn"`
		TokenOut  uint8  `json:"tokenOut"`
		AmountIn  uint64 `json:"amountIn"`
		MinOut    uint64 `json:"minAmountOut,omitempty"`
	}

	if err := json.Unmarshal(params, &swapParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	if swapParams.TokenIn == swapParams.TokenOut {
		return nil, &RPCError{Code: -32602, Message: "Cannot swap same token"}
	}

	tx := &Transaction{
		Hash:   generateTxHash(),
		From:   swapParams.From,
		Type:   TxTypeNative,
		Action: "swap",
		Status: TxStatusPending,
		Params: TxParams{
			TokenIn:      swapParams.TokenIn,
			TokenOut:     swapParams.TokenOut,
			AmountIn:     swapParams.AmountIn,
			MinAmountOut: swapParams.MinOut,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"txHash": tx.Hash,
			"status": "pending",
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// ============================================================================
// Plot Methods
// ============================================================================

// handleGetPlot handles chaosstar_getPlot
func (sg *Stargate) handleGetPlot(params json.RawMessage) (interface{}, *RPCError) {
	var plotParams struct {
		X uint32 `json:"x"`
		Y uint32 `json:"y"`
	}

	if err := json.Unmarshal(params, &plotParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	plot, err := sg.plots.Get(plotParams.X, plotParams.Y)
	if err != nil {
		return nil, &RPCError{Code: -32000, Message: err.Error()}
	}

	return plot, nil
}

// handleBuyPlot handles chaosstar_buyPlot
func (sg *Stargate) handleBuyPlot(params json.RawMessage) (interface{}, *RPCError) {
	var buyParams struct {
		From string `json:"from"`
		X    uint32 `json:"x"`
		Y    uint32 `json:"y"`
	}

	if err := json.Unmarshal(params, &buyParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	tx := &Transaction{
		Hash:   generateTxHash(),
		From:   buyParams.From,
		Type:   TxTypeNative,
		Action: "buyPlot",
		Status: TxStatusPending,
		Params: TxParams{
			X: buyParams.X,
			Y: buyParams.Y,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"txHash": tx.Hash,
			"status": "pending",
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// ============================================================================
// NPC Methods
// ============================================================================

// handleGetNPC handles chaosstar_getNPC
func (sg *Stargate) handleGetNPC(params json.RawMessage) (interface{}, *RPCError) {
	var npcParams struct {
		NPCID string `json:"npcId"`
	}

	if err := json.Unmarshal(params, &npcParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	npc, err := sg.npcs.Get(npcParams.NPCID)
	if err != nil {
		return nil, &RPCError{Code: -32000, Message: err.Error()}
	}

	return npc, nil
}

// handleCreateNPC handles chaosstar_createNPC
func (sg *Stargate) handleCreateNPC(params json.RawMessage) (interface{}, *RPCError) {
	var createParams struct {
		From string `json:"from"`
		Name string `json:"name"`
		X    uint32 `json:"x"`
		Y    uint32 `json:"y"`
	}

	if err := json.Unmarshal(params, &createParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	tx := &Transaction{
		Hash:   generateTxHash(),
		From:   createParams.From,
		Type:   TxTypeNative,
		Action: "createNPC",
		Status: TxStatusPending,
		Params: TxParams{
			Name: createParams.Name,
			X:    createParams.X,
			Y:    createParams.Y,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"txHash": tx.Hash,
			"status": "pending",
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// ============================================================================
// Cross-Chain Methods
// ============================================================================

// handleBridgeToken handles stargate_bridgeToken
func (sg *Stargate) handleBridgeToken(params json.RawMessage) (interface{}, *RPCError) {
	var bridgeParams struct {
		From          string `json:"from"`
		TargetChain   string `json:"targetChain"`
		TargetAddress string `json:"targetAddress"`
		TokenType     uint8  `json:"tokenType"`
		Amount        uint64 `json:"amount"`
	}

	if err := json.Unmarshal(params, &bridgeParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	// Check if target chain is supported
	if _, ok := sg.adapters[bridgeParams.TargetChain]; !ok {
		return nil, &RPCError{Code: -32602, Message: fmt.Sprintf("Unsupported chain: %s", bridgeParams.TargetChain)}
	}

	tx := &Transaction{
		Hash:        generateTxHash(),
		From:        bridgeParams.From,
		To:          bridgeParams.TargetAddress,
		Type:        TxTypeCrossChain,
		TargetChain: bridgeParams.TargetChain,
		Action:      "bridge",
		Status:      TxStatusPending,
		Params: TxParams{
			TokenType:   bridgeParams.TokenType,
			Amount:      bridgeParams.Amount,
			DestChain:   bridgeParams.TargetChain,
			Recipient:   bridgeParams.TargetAddress,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"txHash":      tx.Hash,
			"status":      "pending",
			"targetChain": bridgeParams.TargetChain,
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// handleGetCrossChainBalance handles stargate_getCrossChainBalance
func (sg *Stargate) handleGetCrossChainBalance(params json.RawMessage) (interface{}, *RPCError) {
	var balParams struct {
		Chain   string `json:"chain"`
		Address string `json:"address"`
		Token   string `json:"token,omitempty"` // Optional token address for ERC-20
	}

	if err := json.Unmarshal(params, &balParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	adapter, ok := sg.adapters[balParams.Chain]
	if !ok {
		return nil, &RPCError{Code: -32602, Message: fmt.Sprintf("Unsupported chain: %s", balParams.Chain)}
	}

	var balance interface{}
	var err error

	if balParams.Token != "" {
		balance, err = adapter.GetTokenBalance(balParams.Address, balParams.Token)
	} else {
		balance, err = adapter.GetBalance(balParams.Address)
	}

	if err != nil {
		return nil, &RPCError{Code: -32000, Message: err.Error()}
	}

	return map[string]interface{}{
		"chain":   balParams.Chain,
		"address": balParams.Address,
		"balance": fmt.Sprintf("%v", balance),
	}, nil
}

// ============================================================================
// Warp Methods
// ============================================================================

// handleWarpSend handles warp_sendMessage
func (sg *Stargate) handleWarpSend(params json.RawMessage) (interface{}, *RPCError) {
	if sg.warp == nil {
		return nil, &RPCError{Code: -32000, Message: "Warp messaging not enabled"}
	}

	var warpParams struct {
		From       string `json:"from"`
		DestSubnet string `json:"destSubnet"`
		Payload    string `json:"payload"`
	}

	if err := json.Unmarshal(params, &warpParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	tx := &Transaction{
		Hash:   generateTxHash(),
		From:   warpParams.From,
		Type:   TxTypeWarp,
		Action: "warpMessage",
		Data:   warpParams.Payload,
		Status: TxStatusPending,
		Params: TxParams{
			DestChain: warpParams.DestSubnet,
		},
	}

	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return map[string]interface{}{
			"messageId": tx.Hash,
			"status":    "pending",
		}, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// handleWarpStatus handles warp_getMessageStatus
func (sg *Stargate) handleWarpStatus(params json.RawMessage) (interface{}, *RPCError) {
	if sg.warp == nil {
		return nil, &RPCError{Code: -32000, Message: "Warp messaging not enabled"}
	}

	var statusParams struct {
		MessageID string `json:"messageId"`
	}

	if err := json.Unmarshal(params, &statusParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	msg, err := sg.warp.GetMessageStatus(statusParams.MessageID)
	if err != nil {
		return nil, &RPCError{Code: -32000, Message: err.Error()}
	}

	statusStr := "pending"
	switch msg.Status {
	case WarpStatusSigned:
		statusStr = "signed"
	case WarpStatusDelivered:
		statusStr = "delivered"
	case WarpStatusFailed:
		statusStr = "failed"
	}

	return map[string]interface{}{
		"messageId":  msg.ID,
		"status":     statusStr,
		"destSubnet": msg.DestSubnet,
		"timestamp":  msg.Timestamp.Unix(),
	}, nil
}

// ============================================================================
// Helpers
// ============================================================================

func formatBalance(balance uint64, decimals int) string {
	if balance == 0 {
		return "0.0"
	}

	divisor := uint64(1)
	for i := 0; i < decimals; i++ {
		divisor *= 10
	}

	whole := balance / divisor
	frac := balance % divisor

	return fmt.Sprintf("%d.%09d", whole, frac)
}

