// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate EVM RPC Server - Translates EVM calls to HyperSDK

package stargate

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// EVMServer provides EVM-compatible JSON-RPC interface
type EVMServer struct {
	port         int
	chainID      uint64
	blockchainID string
	backendURL   string
	blockNumber  uint64
	mu           sync.RWMutex
	server       *http.Server
	client       *http.Client
	filterID     uint64
	filters      map[string]*Filter
	filterMu     sync.RWMutex
}

// Filter represents an event filter
type Filter struct {
	ID        string
	Type      string // "log", "block", "pendingTransaction"
	Address   []string
	Topics    [][]string
	FromBlock string
	ToBlock   string
	CreatedAt time.Time
}

// NewEVMServer creates a new EVM RPC server
func NewEVMServer(port int, chainID uint64, blockchainID string, backendURL string) *EVMServer {
	return &EVMServer{
		port:         port,
		chainID:      chainID,
		blockchainID: blockchainID,
		backendURL:   backendURL,
		blockNumber:  1,
		filterID:     0,
		filters:      make(map[string]*Filter),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// EVMRPCRequest represents an incoming JSON-RPC request
type EVMRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	ID      interface{}     `json:"id"`
}

// EVMRPCResponse represents a JSON-RPC response
type EVMRPCResponse struct {
	JSONRPC string       `json:"jsonrpc"`
	ID      interface{}  `json:"id"`
	Result  interface{}  `json:"result,omitempty"`
	Error   *EVMRPCError `json:"error,omitempty"`
}

// EVMRPCError represents a JSON-RPC error
type EVMRPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Start starts the EVM RPC server
func (s *EVMServer) Start() error {
	mux := http.NewServeMux()
	
	// Handle the standard Avalanche RPC path format: /ext/bc/<blockchainID>/rpc
	rpcPath := fmt.Sprintf("/ext/bc/%s/rpc", s.blockchainID)
	mux.HandleFunc(rpcPath, s.handleRPC)
	
	// Also handle variations
	mux.HandleFunc("/ext/bc/", s.handleRPC) // Catch-all for /ext/bc/*
	mux.HandleFunc("/rpc", s.handleRPC)
	mux.HandleFunc("/", s.handleRPC)

	s.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.corsMiddleware(mux),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	// Start block number incrementer (simulate blocks)
	go s.incrementBlockNumber()

	log.Printf("Stargate EVM RPC server starting on port %d", s.port)
	log.Printf("RPC URL: http://localhost:%d/ext/bc/%s/rpc", s.port, s.blockchainID)
	return s.server.ListenAndServe()
}

// Stop stops the server
func (s *EVMServer) Stop() error {
	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return s.server.Shutdown(ctx)
	}
	return nil
}

// corsMiddleware adds CORS headers for MetaMask
func (s *EVMServer) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

// handleRPC handles incoming JSON-RPC requests
func (s *EVMServer) handleRPC(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.sendError(w, nil, -32700, "Parse error", nil)
		return
	}

	// Try to parse as single request
	var req EVMRPCRequest
	if err := json.Unmarshal(body, &req); err != nil {
		// Try batch request
		var batch []EVMRPCRequest
		if err := json.Unmarshal(body, &batch); err != nil {
			s.sendError(w, nil, -32700, "Parse error", nil)
			return
		}
		
		// Handle batch
		var responses []EVMRPCResponse
		for _, r := range batch {
			resp := s.processRequest(&r)
			responses = append(responses, resp)
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(responses)
		return
	}

	// Handle single request
	resp := s.processRequest(&req)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// processRequest processes a single JSON-RPC request
func (s *EVMServer) processRequest(req *EVMRPCRequest) EVMRPCResponse {
	log.Printf("RPC: %s", req.Method)

	switch req.Method {
	case "eth_chainId":
		return s.ethChainId(req)
	case "net_version":
		return s.netVersion(req)
	case "eth_blockNumber":
		return s.ethBlockNumber(req)
	case "eth_getBalance":
		return s.ethGetBalance(req)
	case "eth_getTransactionCount":
		return s.ethGetTransactionCount(req)
	case "eth_gasPrice":
		return s.ethGasPrice(req)
	case "eth_estimateGas":
		return s.ethEstimateGas(req)
	case "eth_sendRawTransaction":
		return s.ethSendRawTransaction(req)
	case "eth_getTransactionReceipt":
		return s.ethGetTransactionReceipt(req)
	case "eth_call":
		return s.ethCall(req)
	case "eth_getCode":
		return s.ethGetCode(req)
	case "eth_getBlockByNumber":
		return s.ethGetBlockByNumber(req)
	case "eth_getBlockByHash":
		return s.ethGetBlockByHash(req)
	case "eth_accounts":
		return s.ethAccounts(req)
	case "eth_syncing":
		return s.ethSyncing(req)
	case "web3_clientVersion":
		return s.web3ClientVersion(req)
	case "eth_newFilter":
		return s.ethNewFilter(req)
	case "eth_newBlockFilter":
		return s.ethNewBlockFilter(req)
	case "eth_newPendingTransactionFilter":
		return s.ethNewPendingTransactionFilter(req)
	case "eth_uninstallFilter":
		return s.ethUninstallFilter(req)
	case "eth_getFilterChanges":
		return s.ethGetFilterChanges(req)
	case "eth_getFilterLogs":
		return s.ethGetFilterLogs(req)
	case "eth_getLogs":
		return s.ethGetLogs(req)
	case "eth_subscribe", "eth_unsubscribe":
		return s.notSupported(req)
	default:
		log.Printf("Unknown method: %s", req.Method)
		return EVMRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &EVMRPCError{Code: -32601, Message: "Method not found: " + req.Method},
		}
	}
}

// eth_chainId returns the chain ID
func (s *EVMServer) ethChainId(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  fmt.Sprintf("0x%x", s.chainID),
	}
}

// net_version returns the network ID
func (s *EVMServer) netVersion(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  strconv.FormatUint(s.chainID, 10),
	}
}

// eth_blockNumber returns the current block number
func (s *EVMServer) ethBlockNumber(req *EVMRPCRequest) EVMRPCResponse {
	s.mu.RLock()
	blockNum := s.blockNumber
	s.mu.RUnlock()
	
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  fmt.Sprintf("0x%x", blockNum),
	}
}

// eth_getBalance returns account balance
func (s *EVMServer) ethGetBalance(req *EVMRPCRequest) EVMRPCResponse {
	// Try to get balance from backend
	// For now, return a default balance
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x0", // 0 balance
	}
}

// eth_getTransactionCount returns nonce
func (s *EVMServer) ethGetTransactionCount(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x0",
	}
}

// eth_gasPrice returns gas price
func (s *EVMServer) ethGasPrice(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x3b9aca00", // 1 gwei
	}
}

// eth_estimateGas estimates gas for a transaction
func (s *EVMServer) ethEstimateGas(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x5208", // 21000 gas
	}
}

// eth_sendRawTransaction sends a transaction
func (s *EVMServer) ethSendRawTransaction(req *EVMRPCRequest) EVMRPCResponse {
	// Parse the raw transaction and forward to HyperSDK
	// For now, return a mock tx hash
	txHash := fmt.Sprintf("0x%064x", time.Now().UnixNano())
	
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  txHash,
	}
}

// eth_getTransactionReceipt returns transaction receipt
func (s *EVMServer) ethGetTransactionReceipt(req *EVMRPCRequest) EVMRPCResponse {
	// Return null for unknown transactions
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  nil,
	}
}

// eth_call executes a call
func (s *EVMServer) ethCall(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x",
	}
}

// eth_getCode returns contract code
func (s *EVMServer) ethGetCode(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "0x", // No code (EOA)
	}
}

// eth_getBlockByNumber returns block by number
func (s *EVMServer) ethGetBlockByNumber(req *EVMRPCRequest) EVMRPCResponse {
	s.mu.RLock()
	blockNum := s.blockNumber
	s.mu.RUnlock()

	block := map[string]interface{}{
		"number":           fmt.Sprintf("0x%x", blockNum),
		"hash":             fmt.Sprintf("0x%064x", blockNum),
		"parentHash":       fmt.Sprintf("0x%064x", blockNum-1),
		"nonce":            "0x0000000000000000",
		"sha3Uncles":       "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		"logsBloom":        "0x" + strings.Repeat("00", 256),
		"transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		"stateRoot":        "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		"receiptsRoot":     "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		"miner":            "0x0000000000000000000000000000000000000000",
		"difficulty":       "0x0",
		"totalDifficulty":  "0x0",
		"extraData":        "0x",
		"size":             "0x0",
		"gasLimit":         "0x1c9c380",
		"gasUsed":          "0x0",
		"timestamp":        fmt.Sprintf("0x%x", time.Now().Unix()),
		"transactions":     []interface{}{},
		"uncles":           []interface{}{},
		"baseFeePerGas":    "0x3b9aca00",
	}

	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  block,
	}
}

// eth_getBlockByHash returns block by hash
func (s *EVMServer) ethGetBlockByHash(req *EVMRPCRequest) EVMRPCResponse {
	return s.ethGetBlockByNumber(req)
}

// eth_accounts returns accounts (empty for non-custodial)
func (s *EVMServer) ethAccounts(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  []string{},
	}
}

// eth_syncing returns sync status
func (s *EVMServer) ethSyncing(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  false, // Not syncing
	}
}

// web3_clientVersion returns client version
func (s *EVMServer) web3ClientVersion(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  "ChaosStar-Stargate/1.0.0",
	}
}

// eth_newFilter creates a new log filter
func (s *EVMServer) ethNewFilter(req *EVMRPCRequest) EVMRPCResponse {
	s.filterMu.Lock()
	defer s.filterMu.Unlock()

	s.filterID++
	filterID := fmt.Sprintf("0x%x", s.filterID)

	// Parse filter params
	var params []map[string]interface{}
	if err := json.Unmarshal(req.Params, &params); err == nil && len(params) > 0 {
		filter := &Filter{
			ID:        filterID,
			Type:      "log",
			CreatedAt: time.Now(),
		}

		if addr, ok := params[0]["address"]; ok {
			switch v := addr.(type) {
			case string:
				filter.Address = []string{v}
			case []interface{}:
				for _, a := range v {
					if s, ok := a.(string); ok {
						filter.Address = append(filter.Address, s)
					}
				}
			}
		}

		s.filters[filterID] = filter
	} else {
		s.filters[filterID] = &Filter{
			ID:        filterID,
			Type:      "log",
			CreatedAt: time.Now(),
		}
	}

	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  filterID,
	}
}

// eth_newBlockFilter creates a new block filter
func (s *EVMServer) ethNewBlockFilter(req *EVMRPCRequest) EVMRPCResponse {
	s.filterMu.Lock()
	defer s.filterMu.Unlock()

	s.filterID++
	filterID := fmt.Sprintf("0x%x", s.filterID)

	s.filters[filterID] = &Filter{
		ID:        filterID,
		Type:      "block",
		CreatedAt: time.Now(),
	}

	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  filterID,
	}
}

// eth_newPendingTransactionFilter creates a new pending tx filter
func (s *EVMServer) ethNewPendingTransactionFilter(req *EVMRPCRequest) EVMRPCResponse {
	s.filterMu.Lock()
	defer s.filterMu.Unlock()

	s.filterID++
	filterID := fmt.Sprintf("0x%x", s.filterID)

	s.filters[filterID] = &Filter{
		ID:        filterID,
		Type:      "pendingTransaction",
		CreatedAt: time.Now(),
	}

	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  filterID,
	}
}

// eth_uninstallFilter removes a filter
func (s *EVMServer) ethUninstallFilter(req *EVMRPCRequest) EVMRPCResponse {
	var params []string
	if err := json.Unmarshal(req.Params, &params); err != nil || len(params) == 0 {
		return EVMRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  false,
		}
	}

	filterID := params[0]

	s.filterMu.Lock()
	defer s.filterMu.Unlock()

	if _, exists := s.filters[filterID]; exists {
		delete(s.filters, filterID)
		return EVMRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  true,
		}
	}

	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  false,
	}
}

// eth_getFilterChanges returns filter changes since last poll
func (s *EVMServer) ethGetFilterChanges(req *EVMRPCRequest) EVMRPCResponse {
	// Return empty array (no new events)
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  []interface{}{},
	}
}

// eth_getFilterLogs returns all logs matching the filter
func (s *EVMServer) ethGetFilterLogs(req *EVMRPCRequest) EVMRPCResponse {
	// Return empty array (no logs)
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  []interface{}{},
	}
}

// eth_getLogs returns logs matching the filter criteria
func (s *EVMServer) ethGetLogs(req *EVMRPCRequest) EVMRPCResponse {
	// Return empty array (no logs)
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  []interface{}{},
	}
}

// notSupported returns error for unsupported methods
func (s *EVMServer) notSupported(req *EVMRPCRequest) EVMRPCResponse {
	return EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Error:   &EVMRPCError{Code: -32601, Message: "Method not supported: " + req.Method},
	}
}

// sendError sends an error response
func (s *EVMServer) sendError(w http.ResponseWriter, id interface{}, code int, message string, data interface{}) {
	resp := EVMRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error:   &EVMRPCError{Code: code, Message: message, Data: data},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// incrementBlockNumber simulates block production
func (s *EVMServer) incrementBlockNumber() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		s.blockNumber++
		s.mu.Unlock()
	}
}

// forwardToBackend forwards a request to the HyperSDK backend
func (s *EVMServer) forwardToBackend(method string, params interface{}) (json.RawMessage, error) {
	reqBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  method,
		"params":  params,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Post(s.backendURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rpcResp struct {
		Result json.RawMessage `json:"result"`
		Error  *EVMRPCError   `json:"error"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error: %s", rpcResp.Error.Message)
	}

	return rpcResp.Result, nil
}

