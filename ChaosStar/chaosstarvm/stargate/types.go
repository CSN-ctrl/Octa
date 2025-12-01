// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate types and data structures

package stargate

import (
	"encoding/json"
	"math/big"
	"sync"
	"time"
)

// JSON-RPC types
type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	ID      interface{}     `json:"id"`
}

type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Transaction types
type TxType int

const (
	TxTypeNative TxType = iota
	TxTypeCrossChain
	TxTypeWarp
)

type TxStatus int

const (
	TxStatusPending TxStatus = iota
	TxStatusConfirmed
	TxStatusFailed
)

// Transaction represents a Stargate transaction
type Transaction struct {
	Hash        string     `json:"hash"`
	From        string     `json:"from"`
	To          string     `json:"to"`
	Value       *big.Int   `json:"value"`
	Data        string     `json:"data"`
	Type        TxType     `json:"type"`
	Action      string     `json:"action"`
	TargetChain string     `json:"targetChain,omitempty"`
	Status      TxStatus   `json:"status"`
	Error       string     `json:"error,omitempty"`
	Receipt     *TxResult  `json:"receipt,omitempty"`
	Timestamp   time.Time  `json:"timestamp"`
	Params      TxParams   `json:"params,omitempty"`
}

// TxParams holds action-specific parameters
type TxParams struct {
	// Token transfer
	TokenType uint8  `json:"tokenType,omitempty"`
	Amount    uint64 `json:"amount,omitempty"`
	Recipient string `json:"recipient,omitempty"`
	Memo      string `json:"memo,omitempty"`

	// Plot operations
	X uint32 `json:"x,omitempty"`
	Y uint32 `json:"y,omitempty"`

	// NPC operations
	NPCID string `json:"npcId,omitempty"`
	Name  string `json:"name,omitempty"`
	Skill string `json:"skill,omitempty"`

	// Swap operations
	TokenIn     uint8  `json:"tokenIn,omitempty"`
	TokenOut    uint8  `json:"tokenOut,omitempty"`
	AmountIn    uint64 `json:"amountIn,omitempty"`
	MinAmountOut uint64 `json:"minAmountOut,omitempty"`

	// Cross-chain
	SourceChain string `json:"sourceChain,omitempty"`
	DestChain   string `json:"destChain,omitempty"`
	BridgeToken string `json:"bridgeToken,omitempty"`
}

// TxResult holds transaction execution result
type TxResult struct {
	Success     bool        `json:"success"`
	Hash        string      `json:"hash"`
	BlockNumber uint64      `json:"blockNumber"`
	GasUsed     uint64      `json:"gasUsed"`
	Logs        []Log       `json:"logs"`
	Output      interface{} `json:"output,omitempty"`
}

// Log represents an event log
type Log struct {
	Address string   `json:"address"`
	Topics  []string `json:"topics"`
	Data    string   `json:"data"`
}

// Token types
const (
	TokenXBGL  uint8 = 0
	TokenChaos uint8 = 1
	TokenXen   uint8 = 2
)

// TxCache caches transaction receipts
type TxCache struct {
	cache map[string]*Transaction
	ttl   time.Duration
	mu    sync.RWMutex
}

func NewTxCache(size int, ttl time.Duration) *TxCache {
	tc := &TxCache{
		cache: make(map[string]*Transaction, size),
		ttl:   ttl,
	}

	// Start cleanup goroutine
	go tc.cleanup()

	return tc
}

func (tc *TxCache) Set(hash string, tx *Transaction) {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	tc.cache[hash] = tx
}

func (tc *TxCache) Get(hash string) *Transaction {
	tc.mu.RLock()
	defer tc.mu.RUnlock()
	return tc.cache[hash]
}

func (tc *TxCache) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		tc.mu.Lock()
		now := time.Now()
		for hash, tx := range tc.cache {
			if now.Sub(tx.Timestamp) > tc.ttl {
				delete(tc.cache, hash)
			}
		}
		tc.mu.Unlock()
	}
}

// NonceStore tracks account nonces
type NonceStore struct {
	nonces map[string]uint64
	mu     sync.RWMutex
}

func NewNonceStore() *NonceStore {
	return &NonceStore{
		nonces: make(map[string]uint64),
	}
}

func (ns *NonceStore) Get(addr string) uint64 {
	ns.mu.RLock()
	defer ns.mu.RUnlock()
	return ns.nonces[addr]
}

func (ns *NonceStore) Increment(addr string) uint64 {
	ns.mu.Lock()
	defer ns.mu.Unlock()
	ns.nonces[addr]++
	return ns.nonces[addr]
}

func (ns *NonceStore) Set(addr string, nonce uint64) {
	ns.mu.Lock()
	defer ns.mu.Unlock()
	ns.nonces[addr] = nonce
}

// BlockInfo represents block information
type BlockInfo struct {
	Height    uint64 `json:"height"`
	Timestamp int64  `json:"timestamp"`
	BlockID   string `json:"blockId"`
	TxCount   int    `json:"txCount"`
	ParentID  string `json:"parentId"`
	StateRoot string `json:"stateRoot"`
}

