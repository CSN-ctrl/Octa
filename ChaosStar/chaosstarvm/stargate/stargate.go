// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate - Unified Multi-Chain & Cross-Subnet Hub

package stargate

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Stargate is the unified relay hub for ChaosStar
type Stargate struct {
	config     *Config
	httpServer *http.Server
	wsUpgrader websocket.Upgrader

	// Module handlers
	treasury   *TreasuryModule
	plots      *PlotModule
	npcs       *NPCModule
	industrial *IndustrialModule
	tokens     *TokenModule

	// Chain adapters
	adapters map[string]ChainAdapter

	// Warp messenger for cross-subnet
	warp *WarpMessenger

	// Transaction processing
	txQueue    chan *Transaction
	txCache    *TxCache
	nonceStore *NonceStore

	// State
	chainID    *big.Int
	blockNum   uint64
	running    atomic.Bool
	wg         sync.WaitGroup
}

// Config holds Stargate configuration
type Config struct {
	// Server settings
	HTTPPort    int    `json:"httpPort"`
	WSPort      int    `json:"wsPort"`
	RPCEndpoint string `json:"rpcEndpoint"`

	// Chain settings
	ChainID   uint64 `json:"chainId"`
	NetworkID uint32 `json:"networkId"`

	// HyperVM RPC
	HyperVMRPC string `json:"hypervmRpc"`

	// External chain RPCs
	EthereumRPC  string `json:"ethereumRpc,omitempty"`
	PolygonRPC   string `json:"polygonRpc,omitempty"`
	AvalancheRPC string `json:"avalancheRpc,omitempty"`
	BSCRPC       string `json:"bscRpc,omitempty"`

	// Warp settings
	SubnetID    string `json:"subnetId"`
	WarpEnabled bool   `json:"warpEnabled"`

	// Processing
	TxQueueSize   int `json:"txQueueSize"`
	WorkerCount   int `json:"workerCount"`
	CacheSize     int `json:"cacheSize"`
	CacheTTL      int `json:"cacheTtlSeconds"`
}

// DefaultConfig returns default Stargate configuration
func DefaultConfig() *Config {
	return &Config{
		HTTPPort:    8545,
		WSPort:      8546,
		ChainID:     43114, // Avalanche-compatible chain ID
		NetworkID:   1,
		HyperVMRPC:  "http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi",
		TxQueueSize: 10000,
		WorkerCount: 100,
		CacheSize:   10000,
		CacheTTL:    300,
		WarpEnabled: true,
	}
}

// New creates a new Stargate instance
func New(config *Config) (*Stargate, error) {
	if config == nil {
		config = DefaultConfig()
	}

	sg := &Stargate{
		config:     config,
		chainID:    big.NewInt(int64(config.ChainID)),
		txQueue:    make(chan *Transaction, config.TxQueueSize),
		txCache:    NewTxCache(config.CacheSize, time.Duration(config.CacheTTL)*time.Second),
		nonceStore: NewNonceStore(),
		adapters:   make(map[string]ChainAdapter),
		wsUpgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}

	// Initialize modules
	sg.treasury = NewTreasuryModule(config.HyperVMRPC)
	sg.plots = NewPlotModule(config.HyperVMRPC)
	sg.npcs = NewNPCModule(config.HyperVMRPC)
	sg.industrial = NewIndustrialModule(config.HyperVMRPC)
	sg.tokens = NewTokenModule(config.HyperVMRPC)

	// Initialize chain adapters
	if config.EthereumRPC != "" {
		sg.adapters["ethereum"] = NewEVMAdapter("ethereum", 1, config.EthereumRPC)
	}
	if config.PolygonRPC != "" {
		sg.adapters["polygon"] = NewEVMAdapter("polygon", 137, config.PolygonRPC)
	}
	if config.AvalancheRPC != "" {
		sg.adapters["avalanche"] = NewEVMAdapter("avalanche", 43114, config.AvalancheRPC)
	}
	if config.BSCRPC != "" {
		sg.adapters["bsc"] = NewEVMAdapter("bsc", 56, config.BSCRPC)
	}

	// Initialize Warp messenger
	if config.WarpEnabled {
		sg.warp = NewWarpMessenger(config.SubnetID, config.HyperVMRPC)
	}

	return sg, nil
}

// Start starts the Stargate server
func (sg *Stargate) Start() error {
	if sg.running.Load() {
		return fmt.Errorf("stargate already running")
	}

	sg.running.Store(true)

	// Start transaction workers
	for i := 0; i < sg.config.WorkerCount; i++ {
		sg.wg.Add(1)
		go sg.txWorker(i)
	}

	// Start HTTP server
	router := mux.NewRouter()
	router.HandleFunc("/", sg.handleRPC).Methods("POST")
	router.HandleFunc("/ws", sg.handleWebSocket)
	router.HandleFunc("/health", sg.handleHealth).Methods("GET")

	sg.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", sg.config.HTTPPort),
		Handler:      sg.corsMiddleware(router),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	sg.wg.Add(1)
	go func() {
		defer sg.wg.Done()
		if err := sg.httpServer.ListenAndServe(); err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	fmt.Printf("🌟 Stargate started on port %d\n", sg.config.HTTPPort)
	fmt.Printf("   Chain ID: %d\n", sg.config.ChainID)
	fmt.Printf("   MetaMask RPC: http://localhost:%d\n", sg.config.HTTPPort)

	return nil
}

// Stop stops the Stargate server
func (sg *Stargate) Stop() error {
	if !sg.running.Load() {
		return nil
	}

	sg.running.Store(false)
	close(sg.txQueue)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := sg.httpServer.Shutdown(ctx); err != nil {
		return err
	}

	sg.wg.Wait()
	fmt.Println("🌟 Stargate stopped")
	return nil
}

// corsMiddleware adds CORS headers
func (sg *Stargate) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// handleHealth returns health status
func (sg *Stargate) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"chainId": sg.config.ChainID,
		"block":   atomic.LoadUint64(&sg.blockNum),
	})
}

// handleRPC handles JSON-RPC requests
func (sg *Stargate) handleRPC(w http.ResponseWriter, r *http.Request) {
	var req JSONRPCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sg.sendError(w, nil, -32700, "Parse error")
		return
	}

	result, err := sg.processRPCMethod(req.Method, req.Params)
	if err != nil {
		sg.sendError(w, req.ID, err.Code, err.Message)
		return
	}

	sg.sendResult(w, req.ID, result)
}

// handleWebSocket handles WebSocket connections
func (sg *Stargate) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := sg.wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var req JSONRPCRequest
		if err := json.Unmarshal(message, &req); err != nil {
			continue
		}

		result, rpcErr := sg.processRPCMethod(req.Method, req.Params)

		var response interface{}
		if rpcErr != nil {
			response = JSONRPCResponse{
				JSONRPC: "2.0",
				ID:      req.ID,
				Error:   rpcErr,
			}
		} else {
			response = JSONRPCResponse{
				JSONRPC: "2.0",
				ID:      req.ID,
				Result:  result,
			}
		}

		responseBytes, _ := json.Marshal(response)
		conn.WriteMessage(websocket.TextMessage, responseBytes)
	}
}

// processRPCMethod routes RPC methods to handlers
func (sg *Stargate) processRPCMethod(method string, params json.RawMessage) (interface{}, *RPCError) {
	switch method {
	// Standard Ethereum methods for MetaMask compatibility
	case "eth_chainId":
		return fmt.Sprintf("0x%x", sg.config.ChainID), nil

	case "eth_blockNumber":
		return fmt.Sprintf("0x%x", atomic.LoadUint64(&sg.blockNum)), nil

	case "eth_getBalance":
		return sg.handleGetBalance(params)

	case "eth_getTransactionCount":
		return sg.handleGetTransactionCount(params)

	case "eth_sendTransaction":
		return sg.handleSendTransaction(params)

	case "eth_sendRawTransaction":
		return sg.handleSendRawTransaction(params)

	case "eth_call":
		return sg.handleCall(params)

	case "eth_estimateGas":
		return "0x5208", nil // 21000 gas

	case "eth_gasPrice":
		return "0x3b9aca00", nil // 1 gwei

	case "eth_getTransactionReceipt":
		return sg.handleGetTransactionReceipt(params)

	case "eth_getTransactionByHash":
		return sg.handleGetTransactionByHash(params)

	case "eth_accounts":
		return []string{}, nil

	case "eth_getCode":
		return "0x", nil

	case "eth_getBlockByNumber":
		return sg.handleGetBlockByNumber(params)

	case "eth_getBlockByHash":
		return sg.handleGetBlockByHash(params)

	case "net_version":
		return fmt.Sprintf("%d", sg.config.NetworkID), nil

	case "net_listening":
		return true, nil

	case "web3_clientVersion":
		return "Stargate/1.0.0", nil

	// ChaosStar-specific methods
	case "chaosstar_getTokenBalance":
		return sg.handleGetTokenBalance(params)

	case "chaosstar_transfer":
		return sg.handleTransfer(params)

	case "chaosstar_swap":
		return sg.handleSwap(params)

	case "chaosstar_getPlot":
		return sg.handleGetPlot(params)

	case "chaosstar_buyPlot":
		return sg.handleBuyPlot(params)

	case "chaosstar_getNPC":
		return sg.handleGetNPC(params)

	case "chaosstar_createNPC":
		return sg.handleCreateNPC(params)

	// Cross-chain methods
	case "stargate_bridgeToken":
		return sg.handleBridgeToken(params)

	case "stargate_getCrossChainBalance":
		return sg.handleGetCrossChainBalance(params)

	// Warp methods
	case "warp_sendMessage":
		return sg.handleWarpSend(params)

	case "warp_getMessageStatus":
		return sg.handleWarpStatus(params)

	default:
		return nil, &RPCError{Code: -32601, Message: fmt.Sprintf("Method not found: %s", method)}
	}
}

// sendResult sends a successful JSON-RPC response
func (sg *Stargate) sendResult(w http.ResponseWriter, id interface{}, result interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	})
}

// sendError sends an error JSON-RPC response
func (sg *Stargate) sendError(w http.ResponseWriter, id interface{}, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error:   &RPCError{Code: code, Message: message},
	})
}

// txWorker processes transactions from the queue
func (sg *Stargate) txWorker(id int) {
	defer sg.wg.Done()

	for tx := range sg.txQueue {
		sg.processTx(tx)
	}
}

// processTx processes a single transaction
func (sg *Stargate) processTx(tx *Transaction) {
	// Route based on transaction type
	var result *TxResult
	var err error

	switch tx.Type {
	case TxTypeNative:
		result, err = sg.processNativeTx(tx)
	case TxTypeCrossChain:
		result, err = sg.processCrossChainTx(tx)
	case TxTypeWarp:
		result, err = sg.processWarpTx(tx)
	default:
		err = fmt.Errorf("unknown transaction type")
	}

	if err != nil {
		tx.Status = TxStatusFailed
		tx.Error = err.Error()
	} else {
		tx.Status = TxStatusConfirmed
		tx.Receipt = result
	}

	// Cache the result
	sg.txCache.Set(tx.Hash, tx)
}

// processNativeTx processes a native ChaosStar transaction
func (sg *Stargate) processNativeTx(tx *Transaction) (*TxResult, error) {
	// Route to appropriate module based on action
	switch tx.Action {
	case "transfer":
		return sg.tokens.Transfer(tx)
	case "swap":
		return sg.treasury.Swap(tx)
	case "buyPlot":
		return sg.plots.Buy(tx)
	case "upgradePlot":
		return sg.plots.Upgrade(tx)
	case "createNPC":
		return sg.npcs.Create(tx)
	case "trainNPC":
		return sg.npcs.Train(tx)
	default:
		return nil, fmt.Errorf("unknown action: %s", tx.Action)
	}
}

// processCrossChainTx processes a cross-chain transaction
func (sg *Stargate) processCrossChainTx(tx *Transaction) (*TxResult, error) {
	adapter, ok := sg.adapters[tx.TargetChain]
	if !ok {
		return nil, fmt.Errorf("unsupported chain: %s", tx.TargetChain)
	}

	return adapter.SendTransaction(tx)
}

// processWarpTx processes a Warp cross-subnet transaction
func (sg *Stargate) processWarpTx(tx *Transaction) (*TxResult, error) {
	if sg.warp == nil {
		return nil, fmt.Errorf("warp messaging not enabled")
	}

	return sg.warp.SendMessage(tx)
}

// Helper method to parse address from params
func parseAddress(params json.RawMessage, index int) (string, error) {
	var arr []interface{}
	if err := json.Unmarshal(params, &arr); err != nil {
		return "", err
	}
	if index >= len(arr) {
		return "", fmt.Errorf("missing parameter at index %d", index)
	}
	addr, ok := arr[index].(string)
	if !ok {
		return "", fmt.Errorf("invalid address format")
	}
	return addr, nil
}

// handleGetBalance handles eth_getBalance
func (sg *Stargate) handleGetBalance(params json.RawMessage) (interface{}, *RPCError) {
	addr, err := parseAddress(params, 0)
	if err != nil {
		return nil, &RPCError{Code: -32602, Message: err.Error()}
	}

	// Get xBGL balance (native token)
	balance, err := sg.tokens.GetBalance(addr, TokenXBGL)
	if err != nil {
		return "0x0", nil
	}

	return fmt.Sprintf("0x%x", balance), nil
}

// handleGetTransactionCount handles eth_getTransactionCount
func (sg *Stargate) handleGetTransactionCount(params json.RawMessage) (interface{}, *RPCError) {
	addr, err := parseAddress(params, 0)
	if err != nil {
		return nil, &RPCError{Code: -32602, Message: err.Error()}
	}

	nonce := sg.nonceStore.Get(addr)
	return fmt.Sprintf("0x%x", nonce), nil
}

// handleSendTransaction handles eth_sendTransaction
func (sg *Stargate) handleSendTransaction(params json.RawMessage) (interface{}, *RPCError) {
	var txParams []map[string]interface{}
	if err := json.Unmarshal(params, &txParams); err != nil {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	if len(txParams) == 0 {
		return nil, &RPCError{Code: -32602, Message: "Missing transaction"}
	}

	txData := txParams[0]

	// Create transaction
	tx := &Transaction{
		Hash:      generateTxHash(),
		From:      getString(txData, "from"),
		To:        getString(txData, "to"),
		Value:     getBigInt(txData, "value"),
		Data:      getString(txData, "data"),
		Type:      TxTypeNative,
		Action:    "transfer",
		Status:    TxStatusPending,
		Timestamp: time.Now(),
	}

	// Parse data to determine action
	if tx.Data != "" && tx.Data != "0x" {
		tx.Action = sg.parseActionFromData(tx.Data)
	}

	// Increment nonce
	sg.nonceStore.Increment(tx.From)

	// Queue transaction
	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return tx.Hash, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// handleSendRawTransaction handles eth_sendRawTransaction
func (sg *Stargate) handleSendRawTransaction(params json.RawMessage) (interface{}, *RPCError) {
	var arr []string
	if err := json.Unmarshal(params, &arr); err != nil || len(arr) == 0 {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	rawTx := arr[0]

	// Decode and process raw transaction
	tx, err := sg.decodeRawTransaction(rawTx)
	if err != nil {
		return nil, &RPCError{Code: -32602, Message: err.Error()}
	}

	// Queue transaction
	select {
	case sg.txQueue <- tx:
		sg.txCache.Set(tx.Hash, tx)
		return tx.Hash, nil
	default:
		return nil, &RPCError{Code: -32000, Message: "Transaction queue full"}
	}
}

// handleGetTransactionReceipt handles eth_getTransactionReceipt
func (sg *Stargate) handleGetTransactionReceipt(params json.RawMessage) (interface{}, *RPCError) {
	var arr []string
	if err := json.Unmarshal(params, &arr); err != nil || len(arr) == 0 {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	txHash := arr[0]
	tx := sg.txCache.Get(txHash)
	if tx == nil {
		return nil, nil
	}

	if tx.Status == TxStatusPending {
		return nil, nil
	}

	status := "0x1"
	if tx.Status == TxStatusFailed {
		status = "0x0"
	}

	return map[string]interface{}{
		"transactionHash":   tx.Hash,
		"blockNumber":       fmt.Sprintf("0x%x", atomic.LoadUint64(&sg.blockNum)),
		"blockHash":         "0x" + hex.EncodeToString(make([]byte, 32)),
		"from":              tx.From,
		"to":                tx.To,
		"status":            status,
		"gasUsed":           "0x5208",
		"cumulativeGasUsed": "0x5208",
		"logs":              []interface{}{},
	}, nil
}

// handleGetTransactionByHash handles eth_getTransactionByHash
func (sg *Stargate) handleGetTransactionByHash(params json.RawMessage) (interface{}, *RPCError) {
	var arr []string
	if err := json.Unmarshal(params, &arr); err != nil || len(arr) == 0 {
		return nil, &RPCError{Code: -32602, Message: "Invalid params"}
	}

	txHash := arr[0]
	tx := sg.txCache.Get(txHash)
	if tx == nil {
		return nil, nil
	}

	return map[string]interface{}{
		"hash":        tx.Hash,
		"from":        tx.From,
		"to":          tx.To,
		"value":       fmt.Sprintf("0x%x", tx.Value),
		"gas":         "0x5208",
		"gasPrice":    "0x3b9aca00",
		"nonce":       "0x0",
		"blockNumber": fmt.Sprintf("0x%x", atomic.LoadUint64(&sg.blockNum)),
		"blockHash":   "0x" + hex.EncodeToString(make([]byte, 32)),
	}, nil
}

// handleCall handles eth_call
func (sg *Stargate) handleCall(params json.RawMessage) (interface{}, *RPCError) {
	// For now, return empty data
	// This would be expanded to handle contract calls
	return "0x", nil
}

// handleGetBlockByNumber handles eth_getBlockByNumber
func (sg *Stargate) handleGetBlockByNumber(params json.RawMessage) (interface{}, *RPCError) {
	blockNum := atomic.LoadUint64(&sg.blockNum)
	return sg.createBlockResponse(blockNum), nil
}

// handleGetBlockByHash handles eth_getBlockByHash
func (sg *Stargate) handleGetBlockByHash(params json.RawMessage) (interface{}, *RPCError) {
	blockNum := atomic.LoadUint64(&sg.blockNum)
	return sg.createBlockResponse(blockNum), nil
}

func (sg *Stargate) createBlockResponse(blockNum uint64) map[string]interface{} {
	return map[string]interface{}{
		"number":           fmt.Sprintf("0x%x", blockNum),
		"hash":             "0x" + hex.EncodeToString(make([]byte, 32)),
		"parentHash":       "0x" + hex.EncodeToString(make([]byte, 32)),
		"timestamp":        fmt.Sprintf("0x%x", time.Now().Unix()),
		"gasLimit":         "0x1c9c380",
		"gasUsed":          "0x0",
		"transactions":     []interface{}{},
		"transactionsRoot": "0x" + hex.EncodeToString(make([]byte, 32)),
		"stateRoot":        "0x" + hex.EncodeToString(make([]byte, 32)),
		"receiptsRoot":     "0x" + hex.EncodeToString(make([]byte, 32)),
	}
}

// parseActionFromData parses action type from transaction data
func (sg *Stargate) parseActionFromData(data string) string {
	if len(data) < 10 {
		return "transfer"
	}

	// Function selector (first 4 bytes)
	selector := data[2:10]

	// Map selectors to actions
	switch selector {
	case "a9059cbb": // transfer(address,uint256)
		return "transfer"
	case "095ea7b3": // approve(address,uint256)
		return "approve"
	case "23b872dd": // transferFrom(address,address,uint256)
		return "transferFrom"
	default:
		return "unknown"
	}
}

// decodeRawTransaction decodes a raw transaction
func (sg *Stargate) decodeRawTransaction(rawTx string) (*Transaction, error) {
	// Remove 0x prefix
	if len(rawTx) > 2 && rawTx[:2] == "0x" {
		rawTx = rawTx[2:]
	}

	// For now, create a placeholder transaction
	// Full RLP decoding would be implemented here
	tx := &Transaction{
		Hash:      generateTxHash(),
		Type:      TxTypeNative,
		Action:    "transfer",
		Status:    TxStatusPending,
		Timestamp: time.Now(),
	}

	return tx, nil
}

// Helper functions
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getBigInt(m map[string]interface{}, key string) *big.Int {
	s := getString(m, key)
	if s == "" {
		return big.NewInt(0)
	}
	if len(s) > 2 && s[:2] == "0x" {
		s = s[2:]
	}
	val, _ := new(big.Int).SetString(s, 16)
	if val == nil {
		return big.NewInt(0)
	}
	return val
}

func generateTxHash() string {
	b := make([]byte, 32)
	for i := range b {
		b[i] = byte(time.Now().UnixNano() >> (i * 8))
	}
	return "0x" + hex.EncodeToString(b)
}

