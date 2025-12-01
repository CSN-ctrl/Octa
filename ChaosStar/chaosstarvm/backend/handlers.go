// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// API Handlers - REST API endpoint implementations

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError sends an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]interface{}{
		"success": false,
		"error":   message,
	})
}

// ============================================================================
// Health & Info Handlers
// ============================================================================

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	// Check ChaosStar connection
	connected := false
	if err := s.rpc.Ping(); err == nil {
		connected = true
	}

	// Check Stargate connection
	stargateConnected := s.stargate.IsConnected()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":             "healthy",
		"contract_connected": connected,
		"stargate_connected": stargateConnected,
		"chain":              "ChaosStar",
		"chain_id":           s.config.ChainID,
		"blockchain_id":      s.config.BlockchainID,
		"timestamp":          time.Now().Unix(),
	})
}

func (s *Server) statusHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":        "running",
		"version":       "1.0.0",
		"chain_id":      s.config.ChainID,
		"blockchain_id": s.config.BlockchainID,
	})
}

func (s *Server) chainInfoHandler(w http.ResponseWriter, r *http.Request) {
	blockNum, _ := s.stargate.GetBlockNumber()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"chain_id":      s.config.ChainID,
		"blockchain_id": s.config.BlockchainID,
		"block_number":  blockNum,
		"network":       "ChaosStar Network",
	})
}

func (s *Server) apiRootHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "ChaosStar Backend API",
		"version": "1.0.0",
		"endpoints": map[string]string{
			"health":      "/api/health",
			"contracts":   "/api/contracts",
			"plots":       "/api/plots",
			"npcs":        "/api/npcs",
			"city":        "/api/city",
			"economy":     "/api/economy",
			"treasury":    "/api/treasury",
			"governance":  "/api/governance",
			"portfolio":   "/api/portfolio/{address}",
			"accounts":    "/api/accounts",
			"marketplace": "/api/marketplace",
		},
	})
}

// ============================================================================
// Contract Handlers
// ============================================================================

func (s *Server) contractStatusHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status": map[string]interface{}{
			"chaosstarVM": map[string]interface{}{
				"deployed": true,
				"address":  "native",
				"status":   "active",
			},
		},
		"addresses": map[string]string{
			"vm":       s.config.BlockchainID,
			"treasury": s.config.TreasuryAddress,
		},
	})
}

func (s *Server) contractAddressesHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"addresses": map[string]string{
			"vm":           s.config.BlockchainID,
			"treasury":     s.config.TreasuryAddress,
			"plotRegistry": "native-plot-registry",
			"csnToken":     "native-xbgl",
		},
	})
}

func (s *Server) verifyContractHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"verified":      true,
		"chain":         "ChaosStar",
		"blockchain_id": s.config.BlockchainID,
		"native":        true,
	})
}

func (s *Server) contractInfoHandler(w http.ResponseWriter, r *http.Request) {
	info := s.store.GetContractInfo(s.config.ChainID, s.config.BlockchainID)
	respondJSON(w, http.StatusOK, info)
}

// ============================================================================
// Plot Handlers
// ============================================================================

func (s *Server) availablePlotsHandler(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 100
	}

	plots := s.store.GetAvailablePlots(limit, offset)
	respondJSON(w, http.StatusOK, plots)
}

func (s *Server) ownedPlotsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	plots := s.store.GetOwnedPlots(address)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"plots": plots,
	})
}

func (s *Server) plotDetailsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plot ID")
		return
	}

	plot := s.store.GetPlot(plotID)
	if plot == nil {
		respondError(w, http.StatusNotFound, "Plot not found")
		return
	}

	respondJSON(w, http.StatusOK, plot)
}

func (s *Server) buyPlotHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plot ID")
		return
	}

	var req struct {
		Buyer string `json:"buyer"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	plot, err := s.store.BuyPlot(plotID, req.Buyer)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Submit to blockchain
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"plot":    plot,
	})
}

func (s *Server) upgradePlotHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plot ID")
		return
	}

	var req struct {
		From     string `json:"from"`
		NewLevel uint8  `json:"new_level"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	plot := s.store.GetPlot(plotID)
	if plot == nil {
		respondError(w, http.StatusNotFound, "Plot not found")
		return
	}

	if plot.Owner != req.From {
		respondError(w, http.StatusForbidden, "Not plot owner")
		return
	}

	plot.Level = req.NewLevel
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"plot":    plot,
	})
}

func (s *Server) transferPlotHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plot ID")
		return
	}

	var req struct {
		From string `json:"from"`
		To   string `json:"to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	plot := s.store.GetPlot(plotID)
	if plot == nil {
		respondError(w, http.StatusNotFound, "Plot not found")
		return
	}

	if plot.Owner != req.From {
		respondError(w, http.StatusForbidden, "Not plot owner")
		return
	}

	plot.Owner = req.To
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"plot":    plot,
	})
}

func (s *Server) savePlotHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Wallet   string                 `json:"wallet"`
		Address  string                 `json:"address"`
		TokenID  string                 `json:"token_id"`
		PlotID   string                 `json:"plotId"`
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Plot data saved",
	})
}

func (s *Server) plotMatrixHandler(w http.ResponseWriter, r *http.Request) {
	centerX, _ := strconv.Atoi(r.URL.Query().Get("x"))
	centerY, _ := strconv.Atoi(r.URL.Query().Get("y"))
	radius, _ := strconv.Atoi(r.URL.Query().Get("radius"))

	if radius == 0 {
		radius = 5
	}

	matrix := s.store.GetMatrix(centerX, centerY, radius)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"matrix": matrix,
		"center": []int{centerX, centerY},
		"radius": radius,
		"legend": map[string]string{
			"█": "owned",
			"○": "available",
			"·": "empty",
		},
	})
}

// ============================================================================
// Marketplace Handler
// ============================================================================

func (s *Server) marketplaceHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	sortBy := r.URL.Query().Get("sort")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 20
	}

	plots, total := s.store.GetAllPlots(0, 0)

	// Filter by search
	if search != "" {
		var filtered []*PlotData
		for _, plot := range plots {
			if strings.Contains(fmt.Sprintf("%d", plot.PlotID), search) ||
				strings.Contains(plot.Owner, search) {
				filtered = append(filtered, plot)
			}
		}
		plots = filtered
	}

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

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"plots": plots[start:end],
		"count": len(plots[start:end]),
		"total": total,
	})
}

// ============================================================================
// NPC Handlers
// ============================================================================

func (s *Server) listNPCsHandler(w http.ResponseWriter, r *http.Request) {
	npcs := s.store.GetAllNPCs()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"npcs": npcs,
	})
}

func (s *Server) getNPCHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	npcID := vars["id"]

	npc := s.store.GetNPC(npcID)
	if npc == nil {
		respondError(w, http.StatusNotFound, "NPC not found")
		return
	}

	respondJSON(w, http.StatusOK, npc)
}

func (s *Server) spawnNPCHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Count  int    `json:"count"`
		Cohort string `json:"cohort"`
		Owner  string `json:"owner"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Count == 0 {
		req.Count = 1
	}
	if req.Cohort == "" {
		req.Cohort = "child"
	}

	personalities := []string{"curious", "stoic", "rebellious", "empathetic", "analytical"}

	var created []*NPCData
	for i := 0; i < req.Count; i++ {
		npc := &NPCData{
			ID:          uuid.New().String(),
			Owner:       req.Owner,
			Cohort:      req.Cohort,
			Skill:       0.0,
			Loyalty:     0.0,
			Personality: personalities[rand.Intn(len(personalities))],
			Age:         0,
			LocationX:   uint32(rand.Intn(100)),
			LocationY:   uint32(rand.Intn(100)),
		}
		s.store.CreateNPC(npc)
		created = append(created, npc)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"created": created,
		"total":   len(s.store.GetAllNPCs()),
	})
}

func (s *Server) trainNPCHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	npcID := vars["id"]

	var req struct {
		From       string  `json:"from"`
		Skill      string  `json:"skill"`
		Experience float64 `json:"experience"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	npc := s.store.GetNPC(npcID)
	if npc == nil {
		respondError(w, http.StatusNotFound, "NPC not found")
		return
	}

	npc.Skill += req.Experience
	if npc.Loyalty < 100 {
		npc.Loyalty++
	}
	s.store.UpdateNPC(npc)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"npc":     npc,
	})
}

func (s *Server) assignNPCHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	npcID := vars["id"]

	var req struct {
		From string `json:"from"`
		Task string `json:"task"`
		X    uint32 `json:"x"`
		Y    uint32 `json:"y"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	npc := s.store.GetNPC(npcID)
	if npc == nil {
		respondError(w, http.StatusNotFound, "NPC not found")
		return
	}

	npc.AssignedTask = req.Task
	npc.LocationX = req.X
	npc.LocationY = req.Y
	s.store.UpdateNPC(npc)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"npc":     npc,
	})
}

func (s *Server) relocateNPCHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	npcID := vars["id"]

	var req struct {
		From string `json:"from"`
		NewX uint32 `json:"new_x"`
		NewY uint32 `json:"new_y"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	npc := s.store.GetNPC(npcID)
	if npc == nil {
		respondError(w, http.StatusNotFound, "NPC not found")
		return
	}

	npc.LocationX = req.NewX
	npc.LocationY = req.NewY
	if npc.Loyalty >= 5 {
		npc.Loyalty -= 5
	} else {
		npc.Loyalty = 0
	}
	s.store.UpdateNPC(npc)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"npc":     npc,
	})
}

func (s *Server) evolveNPCHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		NPCID          string  `json:"npc_id"`
		SkillDelta     float64 `json:"skill_delta"`
		LoyaltyDelta   float64 `json:"loyalty_delta"`
		PersonalityHint string  `json:"personality_hint"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	npc := s.store.GetNPC(req.NPCID)
	if npc == nil {
		respondError(w, http.StatusNotFound, "NPC not found")
		return
	}

	npc.Skill = max(0.0, npc.Skill+req.SkillDelta)
	npc.Loyalty = min(1.0, max(0.0, npc.Loyalty+req.LoyaltyDelta))
	if req.PersonalityHint != "" {
		npc.Personality = req.PersonalityHint
	}
	s.store.UpdateNPC(npc)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"npc": npc,
	})
}

// ============================================================================
// City Handlers
// ============================================================================

func (s *Server) listCitiesHandler(w http.ResponseWriter, r *http.Request) {
	cities := s.store.GetAllCities()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"cities": cities,
	})
}

func (s *Server) getCityHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	city := s.store.GetCity(name)
	if city == nil {
		respondError(w, http.StatusNotFound, "City not found")
		return
	}

	respondJSON(w, http.StatusOK, city)
}

func (s *Server) createCityHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From string `json:"from"`
		Name string `json:"name"`
		X    uint32 `json:"x"`
		Y    uint32 `json:"y"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	city := &CityData{
		Name:       req.Name,
		Owner:      req.From,
		LocationX:  req.X,
		LocationY:  req.Y,
		Population: 0,
		TaxRate:    5,
		Treasury:   0,
		CreatedAt:  time.Now().Unix(),
	}

	if err := s.store.CreateCity(city); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"city":    city,
	})
}

func (s *Server) updateCityEconomyHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	var req struct {
		From    string `json:"from"`
		TaxRate uint8  `json:"tax_rate"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	city := s.store.GetCity(name)
	if city == nil {
		respondError(w, http.StatusNotFound, "City not found")
		return
	}

	if city.Owner != req.From {
		respondError(w, http.StatusForbidden, "Not city owner")
		return
	}

	if req.TaxRate > 100 {
		respondError(w, http.StatusBadRequest, "Tax rate must be 0-100")
		return
	}

	city.TaxRate = req.TaxRate
	s.store.UpdateCity(city)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"city":    city,
	})
}

func (s *Server) cityStatsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	city := s.store.GetCity(name)
	if city == nil {
		respondError(w, http.StatusNotFound, "City not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"name":       city.Name,
		"population": city.Population,
		"tax_rate":   city.TaxRate,
		"treasury":   city.Treasury,
		"created_at": city.CreatedAt,
	})
}

// ============================================================================
// Economy Handlers
// ============================================================================

func (s *Server) economyStatsHandler(w http.ResponseWriter, r *http.Request) {
	treasury := s.store.GetTreasury()
	prices := s.store.GetTokenPrices()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"treasury":     treasury,
		"token_prices": prices,
		"total_supply": map[string]string{
			"xBGL":  "21000000",
			"CHAOS": "100000000",
			"XEN":   "1000000000",
		},
	})
}

func (s *Server) tokenPricesHandler(w http.ResponseWriter, r *http.Request) {
	prices := s.store.GetTokenPrices()
	respondJSON(w, http.StatusOK, prices)
}

func (s *Server) swapTokensHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From         string `json:"from"`
		TokenIn      uint8  `json:"token_in"`
		TokenOut     uint8  `json:"token_out"`
		AmountIn     uint64 `json:"amount_in"`
		MinAmountOut uint64 `json:"min_amount_out"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Calculate swap output (simplified)
	amountOut := req.AmountIn // 1:1 for now

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"tx_hash":    txHash,
		"amount_in":  req.AmountIn,
		"amount_out": amountOut,
	})
}

// ============================================================================
// Treasury Handlers
// ============================================================================

func (s *Server) treasuryHandler(w http.ResponseWriter, r *http.Request) {
	treasury := s.store.GetTreasury()
	respondJSON(w, http.StatusOK, treasury)
}

func (s *Server) depositHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From      string `json:"from"`
		TokenType uint8  `json:"token_type"`
		Amount    uint64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
	})
}

func (s *Server) withdrawHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		To        string `json:"to"`
		TokenType uint8  `json:"token_type"`
		Amount    uint64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
	})
}

// ============================================================================
// Admin Handlers (Development/Testing)
// ============================================================================

func (s *Server) adminMintHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Address   string  `json:"address"`
		TokenType uint8   `json:"token_type"` // 0=xBGL, 1=CHAOS, 2=XEN
		Amount    float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Address == "" {
		respondError(w, http.StatusBadRequest, "Address is required")
		return
	}

	if req.TokenType > 2 {
		respondError(w, http.StatusBadRequest, "Invalid token type (0=xBGL, 1=CHAOS, 2=XEN)")
		return
	}

	// Mint tokens to the address
	newBalance := s.store.MintTokens(req.Address, req.TokenType, req.Amount)

	tokenNames := []string{"xBGL", "CHAOS", "XEN"}
	txHash := fmt.Sprintf("0xmint_%x", time.Now().UnixNano())

	log.Printf("✓ Admin minted %.4f %s to %s (new balance: %.4f)", 
		req.Amount, tokenNames[req.TokenType], req.Address, newBalance)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"address":     req.Address,
		"token":       tokenNames[req.TokenType],
		"amount":      req.Amount,
		"new_balance": newBalance,
		"tx_hash":     txHash,
	})
}

// ============================================================================
// Balance & Transfer Handlers
// ============================================================================

func (s *Server) balanceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	// Get balances from RPC or use defaults
	xbglBalance, _ := s.rpc.GetBalance(address, 0)
	chaosBalance, _ := s.rpc.GetBalance(address, 1)
	xenBalance, _ := s.rpc.GetBalance(address, 2)

	// Also get minted balances from store (for testing)
	mintedBalances := s.store.GetWalletBalances(address)

	// Combine RPC balances with minted balances
	totalXBGL := float64(xbglBalance)/1e9 + mintedBalances[0]
	totalCHAOS := float64(chaosBalance)/1e9 + mintedBalances[1]
	totalXEN := float64(xenBalance)/1e9 + mintedBalances[2]

	// Format balances
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"address": address,
		"balances": map[string]string{
			"xBGL":  fmt.Sprintf("%.9f", totalXBGL),
			"CHAOS": fmt.Sprintf("%.9f", totalCHAOS),
			"XEN":   fmt.Sprintf("%.9f", totalXEN),
		},
	})
}

func (s *Server) tokenBalanceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]
	token := vars["token"]

	var tokenType uint8
	switch strings.ToLower(token) {
	case "xbgl", "0":
		tokenType = 0
	case "chaos", "1":
		tokenType = 1
	case "xen", "2":
		tokenType = 2
	default:
		respondError(w, http.StatusBadRequest, "Invalid token type")
		return
	}

	balance, _ := s.rpc.GetBalance(address, tokenType)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"address":   address,
		"token":     token,
		"balance":   fmt.Sprintf("%.9f", float64(balance)/1e9),
		"raw":       balance,
	})
}

func (s *Server) transferHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From      string  `json:"from"`
		To        string  `json:"to"`
		Amount    float64 `json:"amount"`
		TokenType string  `json:"token_type"`
		Memo      string  `json:"memo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tx_hash": txHash,
		"from":    req.From,
		"to":      req.To,
		"amount":  req.Amount,
		"token":   req.TokenType,
	})
}

func (s *Server) walletBalanceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	xbglBalance, _ := s.rpc.GetBalance(address, 0)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"address": address,
		"balance": fmt.Sprintf("%.9f", float64(xbglBalance)/1e9),
	})
}

// ============================================================================
// Governance Handlers
// ============================================================================

func (s *Server) listProposalsHandler(w http.ResponseWriter, r *http.Request) {
	proposals := s.store.GetAllProposals()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": proposals,
	})
}

func (s *Server) getProposalHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	proposal := s.store.GetProposal(id)
	if proposal == nil {
		respondError(w, http.StatusNotFound, "Proposal not found")
		return
	}

	respondJSON(w, http.StatusOK, proposal)
}

func (s *Server) createProposalHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Proposer    string `json:"proposer"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Duration    int64  `json:"duration"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	proposal := &ProposalData{
		ID:           uuid.New().String(),
		Title:        req.Title,
		Description:  req.Description,
		Proposer:     req.Proposer,
		Status:       "active",
		VotesFor:     0,
		VotesAgainst: 0,
		StartTime:    time.Now().Unix(),
		EndTime:      time.Now().Unix() + req.Duration,
		Voters:       []string{},
	}

	s.store.CreateProposal(proposal)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"tx_hash":  txHash,
		"proposal": proposal,
	})
}

func (s *Server) voteProposalHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req struct {
		Voter   string `json:"voter"`
		Support bool   `json:"support"`
		Amount  uint64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	proposal := s.store.GetProposal(id)
	if proposal == nil {
		respondError(w, http.StatusNotFound, "Proposal not found")
		return
	}

	// Check if already voted
	for _, v := range proposal.Voters {
		if v == req.Voter {
			respondError(w, http.StatusBadRequest, "Already voted")
			return
		}
	}

	if req.Support {
		proposal.VotesFor += req.Amount
	} else {
		proposal.VotesAgainst += req.Amount
	}
	proposal.Voters = append(proposal.Voters, req.Voter)
	s.store.UpdateProposal(proposal)

	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"tx_hash":  txHash,
		"proposal": proposal,
	})
}

// ============================================================================
// Portfolio Handler
// ============================================================================

func (s *Server) portfolioHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	plots := s.store.GetOwnedPlots(address)
	xbglBalance, _ := s.rpc.GetBalance(address, 0)
	chaosBalance, _ := s.rpc.GetBalance(address, 1)
	xenBalance, _ := s.rpc.GetBalance(address, 2)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"address": address,
		"plots":   plots,
		"balances": map[string]string{
			"xBGL":  fmt.Sprintf("%.9f", float64(xbglBalance)/1e9),
			"CHAOS": fmt.Sprintf("%.9f", float64(chaosBalance)/1e9),
			"XEN":   fmt.Sprintf("%.9f", float64(xenBalance)/1e9),
		},
		"total_plots": len(plots),
	})
}

// ============================================================================
// Account Handlers
// ============================================================================

func (s *Server) listAccountsHandler(w http.ResponseWriter, r *http.Request) {
	// Read keys from ~/.chaosstar/keys directory
	keys := s.loadChaosStarKeys()
	
	accounts := make([]map[string]interface{}, 0, len(keys))
	for _, key := range keys {
		// Get balances for each key
		xbglBalance, _ := s.rpc.GetBalance(key["address"].(string), 0)
		chaosBalance, _ := s.rpc.GetBalance(key["address"].(string), 1)
		xenBalance, _ := s.rpc.GetBalance(key["address"].(string), 2)
		
		// Also get minted balances
		mintedBalances := s.store.GetWalletBalances(key["address"].(string))
		totalXBGL := float64(xbglBalance)/1e9 + mintedBalances[0]
		totalCHAOS := float64(chaosBalance)/1e9 + mintedBalances[1]
		totalXEN := float64(xenBalance)/1e9 + mintedBalances[2]
		
		accounts = append(accounts, map[string]interface{}{
			"id":             key["name"],
			"name":           key["name"],
			"wallet_address": key["address"],
			"public_key":     key["public_key"],
			"type":           "key",
			"balances": map[string]string{
				"xBGL":  fmt.Sprintf("%.9f", totalXBGL),
				"CHAOS": fmt.Sprintf("%.9f", totalCHAOS),
				"XEN":   fmt.Sprintf("%.9f", totalXEN),
			},
		})
	}
	
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"accounts": accounts,
	})
}

// loadChaosStarKeys reads keys from ~/.chaosstar/keys directory
func (s *Server) loadChaosStarKeys() []map[string]interface{} {
	keys := make([]map[string]interface{}, 0)
	
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Failed to get home directory: %v", err)
		return keys
	}
	
	keysDir := filepath.Join(homeDir, ".chaosstar", "keys")
	files, err := os.ReadDir(keysDir)
	if err != nil {
		log.Printf("Failed to read keys directory: %v", err)
		return keys
	}
	
	for _, file := range files {
		if filepath.Ext(file.Name()) != ".json" {
			continue
		}
		
		keyPath := filepath.Join(keysDir, file.Name())
		data, err := os.ReadFile(keyPath)
		if err != nil {
			log.Printf("Failed to read key file %s: %v", file.Name(), err)
			continue
		}
		
		var keyData map[string]interface{}
		if err := json.Unmarshal(data, &keyData); err != nil {
			log.Printf("Failed to parse key file %s: %v", file.Name(), err)
			continue
		}
		
		// Extract key name from filename (remove .json extension)
		keyName := strings.TrimSuffix(file.Name(), ".json")
		keyData["name"] = keyName
		
		keys = append(keys, keyData)
	}
	
	return keys
}

func (s *Server) getAccountHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	xbglBalance, _ := s.rpc.GetBalance(address, 0)
	chaosBalance, _ := s.rpc.GetBalance(address, 1)
	xenBalance, _ := s.rpc.GetBalance(address, 2)
	
	// Also get minted balances
	mintedBalances := s.store.GetWalletBalances(address)
	totalXBGL := float64(xbglBalance)/1e9 + mintedBalances[0]
	totalCHAOS := float64(chaosBalance)/1e9 + mintedBalances[1]
	totalXEN := float64(xenBalance)/1e9 + mintedBalances[2]

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"address": address,
		"balances": map[string]string{
			"xBGL":  fmt.Sprintf("%.9f", totalXBGL),
			"CHAOS": fmt.Sprintf("%.9f", totalCHAOS),
			"XEN":   fmt.Sprintf("%.9f", totalXEN),
		},
		"nonce": 0,
	})
}

// ============================================================================
// ChaosStar Specific Handlers
// ============================================================================

func (s *Server) matrixHandler(w http.ResponseWriter, r *http.Request) {
	s.plotMatrixHandler(w, r)
}

func (s *Server) chaosstarBalanceHandler(w http.ResponseWriter, r *http.Request) {
	s.balanceHandler(w, r)
}

func (s *Server) chaosstarTransferHandler(w http.ResponseWriter, r *http.Request) {
	s.transferHandler(w, r)
}

func (s *Server) stargateStatusHandler(w http.ResponseWriter, r *http.Request) {
	blockNum, _ := s.stargate.GetBlockNumber()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"running":       s.stargate.IsConnected(),
		"rpc_url":       s.config.StargateURL,
		"chain_id":      s.config.ChainID,
		"blockchain_id": s.config.BlockchainID,
		"block_number":  blockNum,
		"metamask_config": map[string]interface{}{
			"networkName":    "ChaosStar Network",
			"rpcUrl":         s.config.StargateURL,
			"chainId":        s.config.ChainID,
			"currencySymbol": "xBGL",
		},
	})
}

// ============================================================================
// IPFS & Document Handlers
// ============================================================================

func (s *Server) ipfsUploadHandler(w http.ResponseWriter, r *http.Request) {
	// Handle file upload to IPFS/Pinata
	// For now, return mock CID
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"cid": fmt.Sprintf("QmMockCID%d", time.Now().Unix()),
		"url": "https://gateway.pinata.cloud/ipfs/QmMockCID",
	})
}

func (s *Server) generateDeedHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	plotID, err := strconv.Atoi(vars["plotId"])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plot ID")
		return
	}

	plot := s.store.GetPlot(plotID)
	if plot == nil {
		respondError(w, http.StatusNotFound, "Plot not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"deed": map[string]interface{}{
			"plot_id":  plotID,
			"owner":    plot.Owner,
			"issued":   time.Now().Format(time.RFC3339),
			"cid":      fmt.Sprintf("QmDeed%d", plotID),
		},
	})
}

func (s *Server) syncHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	plots := s.store.GetOwnedPlots(address)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"synced": len(plots),
	})
}

// Helper functions
func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

// ============================================================================
// RPC Proxy Handler - Forward JSON-RPC requests to HyperSDK node
// ============================================================================

func (s *Server) rpcProxyHandler(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight
	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	// Read the request body
	var rpcRequest map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&rpcRequest); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON-RPC request")
		return
	}

	// Forward to HyperSDK or Stargate
	targetURL := s.config.StargateURL // Try Stargate first (EVM-compatible)
	
	// Marshal the request
	reqBody, err := json.Marshal(rpcRequest)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to marshal request")
		return
	}

	// Create HTTP client with timeout
	client := &http.Client{Timeout: 30 * time.Second}
	
	// Forward request
	resp, err := client.Post(targetURL, "application/json", strings.NewReader(string(reqBody)))
	if err != nil {
		// Try fallback to direct HyperSDK RPC
		targetURL = s.config.HyperRPC
		resp, err = client.Post(targetURL, "application/json", strings.NewReader(string(reqBody)))
		if err != nil {
			respondError(w, http.StatusBadGateway, fmt.Sprintf("RPC request failed: %v", err))
			return
		}
	}
	defer resp.Body.Close()

	// Read response
	var rpcResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rpcResponse); err != nil {
		respondError(w, http.StatusBadGateway, "Failed to decode RPC response")
		return
	}

	// Return response with CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rpcResponse)
}

