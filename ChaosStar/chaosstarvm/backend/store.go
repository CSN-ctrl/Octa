// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Data Store - In-memory storage with blockchain sync

package main

import (
	"fmt"
	"sync"
	"time"
)

// DataStore provides in-memory storage for backend data
type DataStore struct {
	mu sync.RWMutex

	// Plots
	plots       map[int]*PlotData
	plotsByCoord map[string]*PlotData
	totalPlots  int
	plotsSold   int
	plotPrice   float64
	salesActive bool

	// NPCs
	npcs map[string]*NPCData

	// Cities
	cities map[string]*CityData

	// Treasury
	treasury *TreasuryData

	// Governance
	proposals map[string]*ProposalData

	// Token prices
	tokenPrices map[string]float64

	// Wallet balances: address -> tokenType -> balance
	balances map[string]map[uint8]float64
}

// PlotData represents plot information
type PlotData struct {
	PlotID       int               `json:"plot_id"`
	X            int               `json:"x"`
	Y            int               `json:"y"`
	Owner        string            `json:"owner,omitempty"`
	Status       string            `json:"status"`
	PriceXBGL    string            `json:"price_xbgl"`
	Level        uint8             `json:"level"`
	DeedJSONCID  string            `json:"deed_json_cid,omitempty"`
	DeedPDFCID   string            `json:"deed_pdf_cid,omitempty"`
	PurchaseDate string            `json:"purchase_date,omitempty"`
	Resources    map[string]uint64 `json:"resources,omitempty"`
	Metadata     *PlotMetadata     `json:"metadata,omitempty"`
}

// PlotMetadata holds plot metadata
type PlotMetadata struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Image       string `json:"image,omitempty"`
	District    string `json:"district,omitempty"`
}

// NPCData represents NPC information
type NPCData struct {
	ID           string  `json:"id"`
	Owner        string  `json:"owner"`
	Name         string  `json:"name,omitempty"`
	Cohort       string  `json:"cohort"`
	Skill        float64 `json:"skill"`
	Loyalty      float64 `json:"loyalty"`
	Personality  string  `json:"personality"`
	Age          int     `json:"age"`
	LocationX    uint32  `json:"location_x"`
	LocationY    uint32  `json:"location_y"`
	AssignedTask string  `json:"assigned_task,omitempty"`
}

// CityData represents city information
type CityData struct {
	Name       string `json:"name"`
	Owner      string `json:"owner"`
	LocationX  uint32 `json:"location_x"`
	LocationY  uint32 `json:"location_y"`
	Population uint64 `json:"population"`
	TaxRate    uint8  `json:"tax_rate"`
	Treasury   uint64 `json:"treasury"`
	CreatedAt  int64  `json:"created_at"`
}

// TreasuryData represents treasury information
type TreasuryData struct {
	Address        string `json:"treasury_address"`
	BalanceXBGL    string `json:"balance_xbgl"`
	BalanceCHAOS   string `json:"balance_chaos"`
	BalanceXEN     string `json:"balance_xen"`
	TotalRevenue   string `json:"total_revenue_xbgl"`
	TotalPlotsSold int    `json:"total_plots_sold"`
}

// ProposalData represents governance proposal
type ProposalData struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Proposer     string   `json:"proposer"`
	Status       string   `json:"status"`
	VotesFor     uint64   `json:"votes_for"`
	VotesAgainst uint64   `json:"votes_against"`
	StartTime    int64    `json:"start_time"`
	EndTime      int64    `json:"end_time"`
	Voters       []string `json:"voters,omitempty"`
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

// AccountData represents account information
type AccountData struct {
	Address  string            `json:"address"`
	Balances map[string]string `json:"balances"`
	Nonce    uint64            `json:"nonce"`
}

// NewDataStore creates a new data store
func NewDataStore() *DataStore {
	return &DataStore{
		plots:        make(map[int]*PlotData),
		plotsByCoord: make(map[string]*PlotData),
		npcs:         make(map[string]*NPCData),
		cities:       make(map[string]*CityData),
		proposals:    make(map[string]*ProposalData),
		balances:     make(map[string]map[uint8]float64),
		tokenPrices: map[string]float64{
			"xBGL":  1.0,
			"CHAOS": 0.5,
			"XEN":   0.25,
		},
	}
}

// Initialize sets up initial data
func (ds *DataStore) Initialize() {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	ds.totalPlots = 10000
	ds.plotsSold = 0
	ds.plotPrice = 0.1
	ds.salesActive = true

	// Initialize treasury
	ds.treasury = &TreasuryData{
		Address:        "chaosstar1treasury000000000000000000000000000",
		BalanceXBGL:    "1000000.0",
		BalanceCHAOS:   "500000.0",
		BalanceXEN:     "250000.0",
		TotalRevenue:   "0.0",
		TotalPlotsSold: 0,
	}

	// Initialize plots in octagonal matrix pattern
	plotID := 1
	for y := -50; y <= 50; y++ {
		for x := -50; x <= 50; x++ {
			if plotID > ds.totalPlots {
				break
			}

			district := getDistrict(x, y)
			plot := &PlotData{
				PlotID:    plotID,
				X:         x,
				Y:         y,
				Status:    "available",
				PriceXBGL: fmt.Sprintf("%.2f", ds.plotPrice),
				Level:     1,
				Resources: make(map[string]uint64),
				Metadata: &PlotMetadata{
					Name:     fmt.Sprintf("Plot SP-%04d", plotID),
					District: district,
				},
			}
			ds.plots[plotID] = plot
			ds.plotsByCoord[fmt.Sprintf("%d,%d", x, y)] = plot
			plotID++
		}
	}
}

// getDistrict returns district name based on coordinates
func getDistrict(x, y int) string {
	if x == 0 && y == 0 {
		return "Central District"
	} else if x == 0 && y < 0 {
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

// GetPlot returns plot by ID
func (ds *DataStore) GetPlot(plotID int) *PlotData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.plots[plotID]
}

// GetPlotByCoord returns plot by coordinates
func (ds *DataStore) GetPlotByCoord(x, y int) *PlotData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.plotsByCoord[fmt.Sprintf("%d,%d", x, y)]
}

// GetAvailablePlots returns available plots
func (ds *DataStore) GetAvailablePlots(limit, offset int) []*PlotData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var available []*PlotData
	count := 0
	skipped := 0

	for _, plot := range ds.plots {
		if plot.Status == "available" {
			if skipped < offset {
				skipped++
				continue
			}
			if count >= limit {
				break
			}
			available = append(available, plot)
			count++
		}
	}

	return available
}

// GetOwnedPlots returns plots owned by an address
func (ds *DataStore) GetOwnedPlots(address string) []*PlotData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var owned []*PlotData
	for _, plot := range ds.plots {
		if plot.Owner == address {
			owned = append(owned, plot)
		}
	}
	return owned
}

// BuyPlot purchases a plot
func (ds *DataStore) BuyPlot(plotID int, buyer string) (*PlotData, error) {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	plot, exists := ds.plots[plotID]
	if !exists {
		return nil, fmt.Errorf("plot not found")
	}

	if plot.Status != "available" {
		return nil, fmt.Errorf("plot not available")
	}

	plot.Status = "owned"
	plot.Owner = buyer
	plot.PurchaseDate = time.Now().Format(time.RFC3339)
	ds.plotsSold++
	ds.treasury.TotalPlotsSold++

	return plot, nil
}

// GetNPC returns NPC by ID
func (ds *DataStore) GetNPC(npcID string) *NPCData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.npcs[npcID]
}

// GetAllNPCs returns all NPCs
func (ds *DataStore) GetAllNPCs() []*NPCData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var all []*NPCData
	for _, npc := range ds.npcs {
		all = append(all, npc)
	}
	return all
}

// CreateNPC creates a new NPC
func (ds *DataStore) CreateNPC(npc *NPCData) {
	ds.mu.Lock()
	defer ds.mu.Unlock()
	ds.npcs[npc.ID] = npc
}

// UpdateNPC updates an NPC
func (ds *DataStore) UpdateNPC(npc *NPCData) error {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if _, exists := ds.npcs[npc.ID]; !exists {
		return fmt.Errorf("NPC not found")
	}
	ds.npcs[npc.ID] = npc
	return nil
}

// GetCity returns city by name
func (ds *DataStore) GetCity(name string) *CityData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.cities[name]
}

// GetAllCities returns all cities
func (ds *DataStore) GetAllCities() []*CityData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var all []*CityData
	for _, city := range ds.cities {
		all = append(all, city)
	}
	return all
}

// CreateCity creates a new city
func (ds *DataStore) CreateCity(city *CityData) error {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if _, exists := ds.cities[city.Name]; exists {
		return fmt.Errorf("city already exists")
	}
	ds.cities[city.Name] = city
	return nil
}

// UpdateCity updates a city
func (ds *DataStore) UpdateCity(city *CityData) error {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if _, exists := ds.cities[city.Name]; !exists {
		return fmt.Errorf("city not found")
	}
	ds.cities[city.Name] = city
	return nil
}

// GetTreasury returns treasury data
func (ds *DataStore) GetTreasury() *TreasuryData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.treasury
}

// MintTokens mints tokens to an address (admin function)
func (ds *DataStore) MintTokens(address string, tokenType uint8, amount float64) float64 {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if ds.balances[address] == nil {
		ds.balances[address] = make(map[uint8]float64)
	}

	ds.balances[address][tokenType] += amount
	return ds.balances[address][tokenType]
}

// GetWalletBalances returns all token balances for an address
func (ds *DataStore) GetWalletBalances(address string) map[uint8]float64 {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	if ds.balances[address] == nil {
		return map[uint8]float64{0: 0, 1: 0, 2: 0}
	}

	// Return copy to avoid race conditions
	result := make(map[uint8]float64)
	for k, v := range ds.balances[address] {
		result[k] = v
	}
	return result
}

// GetWalletBalance returns balance for a specific token
func (ds *DataStore) GetWalletBalance(address string, tokenType uint8) float64 {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	if ds.balances[address] == nil {
		return 0
	}
	return ds.balances[address][tokenType]
}

// GetContractInfo returns contract info
func (ds *DataStore) GetContractInfo(chainID uint64, blockchainID string) *ContractInfo {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	return &ContractInfo{
		TotalPlots:     ds.totalPlots,
		PlotsSold:      ds.plotsSold,
		PlotsRemaining: ds.totalPlots - ds.plotsSold,
		PriceXBGL:      fmt.Sprintf("%.2f", ds.plotPrice),
		SalesActive:    ds.salesActive,
		Treasury:       ds.treasury.Address,
		ChainID:        chainID,
		BlockchainID:   blockchainID,
	}
}

// GetTokenPrices returns token prices
func (ds *DataStore) GetTokenPrices() map[string]float64 {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	prices := make(map[string]float64)
	for k, v := range ds.tokenPrices {
		prices[k] = v
	}
	return prices
}

// GetProposal returns proposal by ID
func (ds *DataStore) GetProposal(id string) *ProposalData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	return ds.proposals[id]
}

// GetAllProposals returns all proposals
func (ds *DataStore) GetAllProposals() []*ProposalData {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var all []*ProposalData
	for _, p := range ds.proposals {
		all = append(all, p)
	}
	return all
}

// CreateProposal creates a new proposal
func (ds *DataStore) CreateProposal(p *ProposalData) {
	ds.mu.Lock()
	defer ds.mu.Unlock()
	ds.proposals[p.ID] = p
}

// UpdateProposal updates a proposal
func (ds *DataStore) UpdateProposal(p *ProposalData) error {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if _, exists := ds.proposals[p.ID]; !exists {
		return fmt.Errorf("proposal not found")
	}
	ds.proposals[p.ID] = p
	return nil
}

// GetAllPlots returns all plots (with pagination)
func (ds *DataStore) GetAllPlots(limit, offset int) ([]*PlotData, int) {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var plots []*PlotData
	count := 0
	skipped := 0

	for _, plot := range ds.plots {
		if skipped < offset {
			skipped++
			continue
		}
		if limit > 0 && count >= limit {
			break
		}
		plots = append(plots, plot)
		count++
	}

	return plots, len(ds.plots)
}

// GetMatrix returns octagonal matrix visualization
func (ds *DataStore) GetMatrix(centerX, centerY, radius int) [][]string {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	var matrix [][]string
	for y := centerY - radius; y <= centerY+radius; y++ {
		var row []string
		for x := centerX - radius; x <= centerX+radius; x++ {
			plot := ds.plotsByCoord[fmt.Sprintf("%d,%d", x, y)]
			if plot == nil {
				row = append(row, "·")
			} else if plot.Status == "owned" {
				row = append(row, "█")
			} else {
				row = append(row, "○")
			}
		}
		matrix = append(matrix, row)
	}
	return matrix
}

