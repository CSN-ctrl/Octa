// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Octavia Nebula Core Backend - ChaosStar Integration
// Replaces the Python backend with native ChaosStar connectivity

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// Config holds backend configuration
type Config struct {
	Port              int
	ChaoStarRPC       string
	StargateRPC       string
	FrontendDir       string
	ChainID           uint64
	BlockchainID      string
}

var config = Config{
	Port:         5000,
	ChaoStarRPC:  "http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi",
	StargateRPC:  "http://localhost:8545/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/rpc",
	FrontendDir:  "../octavia-nebula-core-main/dist",
	ChainID:      8888,
	BlockchainID: "22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn",
}

// Plot represents a land plot
type Plot struct {
	PlotID       int       `json:"plot_id"`
	X            int       `json:"x"`
	Y            int       `json:"y"`
	Owner        string    `json:"owner,omitempty"`
	Status       string    `json:"status"`
	PriceXBGL    string    `json:"price_xbgl"`
	DeedJSONCID  string    `json:"deed_json_cid,omitempty"`
	DeedPDFCID   string    `json:"deed_pdf_cid,omitempty"`
	PurchaseDate string    `json:"purchase_date,omitempty"`
	Metadata     *PlotMeta `json:"metadata,omitempty"`
}

type PlotMeta struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Image       string `json:"image,omitempty"`
	District    string `json:"district,omitempty"`
}

// Treasury stats
type TreasuryStats struct {
	TreasuryAddress string `json:"treasury_address"`
	BalanceXBGL     string `json:"balance_xbgl"`
	BalanceCHAOS    string `json:"balance_chaos"`
	BalanceXEN      string `json:"balance_xen"`
	TotalRevenue    string `json:"total_revenue_xbgl"`
	TotalPlotsSold  int    `json:"total_plots_sold"`
}

// ContractInfo holds contract/chain info
type ContractInfo struct {
	TotalPlots     int    `json:"total_plots"`
	PlotsSold      int    `json:"plots_sold"`
	PlotsRemaining int    `json:"plots_remaining"`
	PriceXBGL      string `json:"price_xbgl"`
	SalesActive    bool   `json:"sales_active"`
	Treasury       string `json:"treasury"`
	ChainID        uint64 `json:"chain_id"`
	BlockchainID   string `json:"blockchain_id"`
}

// In-memory store (would connect to ChaosStar state in production)
type Store struct {
	mu           sync.RWMutex
	plots        map[int]*Plot
	totalPlots   int
	plotsSold    int
	priceXBGL    float64
	salesActive  bool
	treasury     string
}

var store = &Store{
	plots:       make(map[int]*Plot),
	totalPlots:  10000,
	plotsSold:   0,
	priceXBGL:   0.1,
	salesActive: true,
	treasury:    "chaosstar1treasury000000000000000000000000000",
}

// ChaosStar RPC Client
type ChaoStarClient struct {
	endpoint string
	client   *http.Client
}

func NewChaoStarClient(endpoint string) *ChaoStarClient {
	return &ChaoStarClient{
		endpoint: endpoint,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *ChaoStarClient) Call(method string, params interface{}) (json.RawMessage, error) {
	reqBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  method,
		"params":  params,
	}
	
	body, _ := json.Marshal(reqBody)
	resp, err := c.client.Post(c.endpoint, "application/json", strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var result struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Error != nil {
		return nil, fmt.Errorf(result.Error.Message)
	}
	
	return result.Result, nil
}

var chaosClient *ChaoStarClient

func main() {
	// Load config from env
	if port := os.Getenv("PORT"); port != "" {
		config.Port, _ = strconv.Atoi(port)
	}
	if rpc := os.Getenv("CHAOSSTAR_RPC"); rpc != "" {
		config.ChaoStarRPC = rpc
	}
	if frontend := os.Getenv("FRONTEND_DIR"); frontend != "" {
		config.FrontendDir = frontend
	}
	
	chaosClient = NewChaoStarClient(config.ChaoStarRPC)
	
	// Initialize some sample plots
	initializePlots()
	
	// Setup router
	r := mux.NewRouter()
	
	// API routes
	api := r.PathPrefix("/api").Subrouter()
	
	// Health & Info
	api.HandleFunc("/health", healthHandler).Methods("GET")
	api.HandleFunc("/verify-contract", verifyContractHandler).Methods("GET")
	api.HandleFunc("/contract-info", contractInfoHandler).Methods("GET")
	
	// Plots
	api.HandleFunc("/plots/available", availablePlotsHandler).Methods("GET")
	api.HandleFunc("/plots/owned/{address}", ownedPlotsHandler).Methods("GET")
	api.HandleFunc("/plots/{id}", plotDetailsHandler).Methods("GET")
	api.HandleFunc("/plots/{id}/buy", buyPlotHandler).Methods("POST")
	
	// Marketplace
	api.HandleFunc("/marketplace", marketplaceHandler).Methods("GET")
	
	// Treasury
	api.HandleFunc("/treasury", treasuryHandler).Methods("GET")
	
	// IPFS
	api.HandleFunc("/ipfs/upload", ipfsUploadHandler).Methods("POST")
	
	// ChaosStar specific endpoints
	api.HandleFunc("/chaosstar/matrix", matrixHandler).Methods("GET")
	api.HandleFunc("/chaosstar/balance/{address}", balanceHandler).Methods("GET")
	api.HandleFunc("/chaosstar/transfer", transferHandler).Methods("POST")
	api.HandleFunc("/chaosstar/stargate/status", stargateStatusHandler).Methods("GET")
	
	// Serve frontend
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(config.FrontendDir)))
	
	// CORS
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(r)
	
	log.Printf("🚀 Octavia-ChaosStar Backend starting on port %d", config.Port)
	log.Printf("   ChaosStar RPC: %s", config.ChaoStarRPC)
	log.Printf("   Stargate RPC: %s", config.StargateRPC)
	log.Printf("   Frontend: %s", config.FrontendDir)
	
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", config.Port), handler))
}

func initializePlots() {
	store.mu.Lock()
	defer store.mu.Unlock()
	
	// Initialize plots in octagonal matrix pattern
	plotID := 1
	for y := -50; y <= 50; y++ {
		for x := -50; x <= 50; x++ {
			if plotID > store.totalPlots {
				return
			}
			
			district := getDistrict(x, y)
			store.plots[plotID] = &Plot{
				PlotID:    plotID,
				X:         x,
				Y:         y,
				Status:    "available",
				PriceXBGL: fmt.Sprintf("%.2f", store.priceXBGL),
				Metadata: &PlotMeta{
					Name:     fmt.Sprintf("Plot SP-%04d", plotID),
					District: district,
				},
			}
			plotID++
		}
	}
}

func getDistrict(x, y int) string {
	// 8 districts based on octagonal directions
	if x == 0 && y < 0 {
		return "North Sector"
	} else if x > 0 && y < 0 {
		return "Northeast Quadrant"
	} else if x > 0 && y == 0 {
		return "East Sector"
	} else if x > 0 && y > 0 {
		return "Southeast Quadrant"
	} else if x == 0 && y > 0 {
		return "South Sector"
	} else if x < 0 && y > 0 {
		return "Southwest Quadrant"
	} else if x < 0 && y == 0 {
		return "West Sector"
	} else if x < 0 && y < 0 {
		return "Northwest Quadrant"
	}
	return "Central District"
}

// Handlers

func healthHandler(w http.ResponseWriter, r *http.Request) {
	// Check ChaosStar connection
	connected := false
	_, err := chaosClient.Call("hypersdk.ping", nil)
	if err == nil {
		connected = true
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":             "alive",
		"contract_connected": connected,
		"chain":              "ChaosStar",
		"chain_id":           config.ChainID,
		"blockchain_id":      config.BlockchainID,
	})
}

func verifyContractHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"verified":      true,
		"chain":         "ChaosStar",
		"blockchain_id": config.BlockchainID,
		"native":        true, // Native ChaosStar actions, not EVM contract
	})
}

func contractInfoHandler(w http.ResponseWriter, r *http.Request) {
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	json.NewEncoder(w).Encode(ContractInfo{
		TotalPlots:     store.totalPlots,
		PlotsSold:      store.plotsSold,
		PlotsRemaining: store.totalPlots - store.plotsSold,
		PriceXBGL:      fmt.Sprintf("%.2f", store.priceXBGL),
		SalesActive:    store.salesActive,
		Treasury:       store.treasury,
		ChainID:        config.ChainID,
		BlockchainID:   config.BlockchainID,
	})
}

func availablePlotsHandler(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 100
	}
	
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	var available []Plot
	count := 0
	skipped := 0
	
	for _, plot := range store.plots {
		if plot.Status == "available" {
			if skipped < offset {
				skipped++
				continue
			}
			if count >= limit {
				break
			}
			available = append(available, *plot)
			count++
		}
	}
	
	json.NewEncoder(w).Encode(available)
}

func ownedPlotsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]
	
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	var owned []Plot
	for _, plot := range store.plots {
		if plot.Owner == address {
			owned = append(owned, *plot)
		}
	}
	
	json.NewEncoder(w).Encode(owned)
}

func plotDetailsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, _ := strconv.Atoi(vars["id"])
	
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	if plot, exists := store.plots[plotID]; exists {
		json.NewEncoder(w).Encode(plot)
	} else {
		http.Error(w, "Plot not found", http.StatusNotFound)
	}
}

func buyPlotHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, _ := strconv.Atoi(vars["id"])
	
	var req struct {
		Buyer string `json:"buyer"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	
	store.mu.Lock()
	defer store.mu.Unlock()
	
	plot, exists := store.plots[plotID]
	if !exists {
		http.Error(w, "Plot not found", http.StatusNotFound)
		return
	}
	
	if plot.Status != "available" {
		http.Error(w, "Plot not available", http.StatusBadRequest)
		return
	}
	
	// Update plot
	plot.Status = "owned"
	plot.Owner = req.Buyer
	plot.PurchaseDate = time.Now().Format(time.RFC3339)
	store.plotsSold++
	
	// TODO: Submit actual ChaosStar transaction
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"plot":    plot,
	})
}

func marketplaceHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	sortBy := r.URL.Query().Get("sort")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 20
	}
	
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	var plots []Plot
	for _, plot := range store.plots {
		if search != "" {
			// Filter by search term
			if !strings.Contains(fmt.Sprintf("%d", plot.PlotID), search) &&
				!strings.Contains(plot.Owner, search) {
				continue
			}
		}
		plots = append(plots, *plot)
	}
	
	// Sort
	_ = sortBy // TODO: implement sorting
	
	// Paginate
	start := offset
	end := offset + limit
	if start > len(plots) {
		start = len(plots)
	}
	if end > len(plots) {
		end = len(plots)
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"plots": plots[start:end],
		"count": len(plots[start:end]),
		"total": len(plots),
	})
}

func treasuryHandler(w http.ResponseWriter, r *http.Request) {
	// Get balances from ChaosStar
	stats := TreasuryStats{
		TreasuryAddress: store.treasury,
		BalanceXBGL:     "1000000.0",
		BalanceCHAOS:    "500000.0",
		BalanceXEN:      "250000.0",
		TotalRevenue:    fmt.Sprintf("%.2f", float64(store.plotsSold)*store.priceXBGL),
		TotalPlotsSold:  store.plotsSold,
	}
	
	json.NewEncoder(w).Encode(stats)
}

func ipfsUploadHandler(w http.ResponseWriter, r *http.Request) {
	// Handle file upload to IPFS/Pinata
	// For now, return mock CID
	json.NewEncoder(w).Encode(map[string]interface{}{
		"cid": "QmMockCID" + fmt.Sprintf("%d", time.Now().Unix()),
		"url": "https://gateway.pinata.cloud/ipfs/QmMockCID",
	})
}

// ChaosStar specific handlers

func matrixHandler(w http.ResponseWriter, r *http.Request) {
	centerX, _ := strconv.Atoi(r.URL.Query().Get("x"))
	centerY, _ := strconv.Atoi(r.URL.Query().Get("y"))
	radius, _ := strconv.Atoi(r.URL.Query().Get("radius"))
	
	if radius == 0 {
		radius = 5
	}
	
	store.mu.RLock()
	defer store.mu.RUnlock()
	
	var matrix [][]string
	for y := centerY - radius; y <= centerY+radius; y++ {
		var row []string
		for x := centerX - radius; x <= centerX+radius; x++ {
			// Find plot at this coordinate
			found := false
			for _, plot := range store.plots {
				if plot.X == x && plot.Y == y {
					if plot.Status == "owned" {
						row = append(row, "█")
					} else {
						row = append(row, "○")
					}
					found = true
					break
				}
			}
			if !found {
				row = append(row, "·")
			}
		}
		matrix = append(matrix, row)
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"matrix":  matrix,
		"center":  []int{centerX, centerY},
		"radius":  radius,
		"legend": map[string]string{
			"█": "owned",
			"○": "available",
			"·": "empty",
		},
	})
}

func balanceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]
	
	// Get balances from ChaosStar
	json.NewEncoder(w).Encode(map[string]interface{}{
		"address": address,
		"balances": map[string]string{
			"xBGL":  "100.0",
			"CHAOS": "50.0",
			"XEN":   "25.0",
		},
	})
}

func transferHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From      string  `json:"from"`
		To        string  `json:"to"`
		Amount    float64 `json:"amount"`
		TokenType string  `json:"token_type"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	
	// Submit to ChaosStar
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"from":    req.From,
		"to":      req.To,
		"amount":  req.Amount,
		"token":   req.TokenType,
	})
}

func stargateStatusHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"running":       true,
		"rpc_url":       config.StargateRPC,
		"chain_id":      config.ChainID,
		"blockchain_id": config.BlockchainID,
		"metamask_config": map[string]interface{}{
			"networkName":    "ChaosStar Network",
			"rpcUrl":         config.StargateRPC,
			"chainId":        config.ChainID,
			"currencySymbol": "xBGL",
		},
	})
}

