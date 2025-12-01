// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// ChaosStar Unified Backend - Native blockchain integration
// Replaces Python backend with direct HyperSDK connectivity

package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// Server is the main backend server
type Server struct {
	config     *Config
	router     *mux.Router
	httpServer   *http.Server
	rpc          *HyperRPCClient
	store        *DataStore
	stargate     *StargateClient
	pdfProcessor *PDFProcessor
}

// Config holds server configuration
type Config struct {
	Port            int    `json:"port"`
	HyperRPC        string `json:"hyperRpc"`
	StargateURL     string `json:"stargateUrl"`
	ChainID         uint64 `json:"chainId"`
	BlockchainID    string `json:"blockchainId"`
	FrontendDir     string `json:"frontendDir"`
	EnableCORS      bool   `json:"enableCors"`
	TreasuryAddress string `json:"treasuryAddress"`
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		Port:            5000,
		HyperRPC:        "http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi",
		StargateURL:     "http://localhost:8545",
		ChainID:         8888,
		BlockchainID:    "22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn",
		FrontendDir:     "../octavia-nebula-core/dist",
		EnableCORS:      true,
		TreasuryAddress: "chaosstar1treasury000000000000000000000000000",
	}
}

// NewServer creates a new server instance
func NewServer(config *Config) (*Server, error) {
	if config == nil {
		config = DefaultConfig()
	}

	// Initialize RPC client
	rpc := NewHyperRPCClient(config.HyperRPC)

	// Initialize data store
	store := NewDataStore()

	// Initialize Stargate client
	stargate := NewStargateClient(config.StargateURL)

	// Initialize PDF processor
	pdfProcessor := NewPDFProcessor("./pdf_templates", "./pdf_output")

	s := &Server{
		config:       config,
		router:       mux.NewRouter(),
		rpc:          rpc,
		store:        store,
		stargate:     stargate,
		pdfProcessor: pdfProcessor,
	}

	s.setupRoutes()

	return s, nil
}

// setupRoutes configures all API routes
func (s *Server) setupRoutes() {
	// RPC Proxy - MUST be registered before PathPrefix routes
	// This allows forwarding JSON-RPC requests to HyperSDK/Stargate with CORS
	s.router.HandleFunc("/rpc", s.rpcProxyHandler).Methods("POST", "OPTIONS")
	
	// API router
	api := s.router.PathPrefix("/api").Subrouter()

	// Health & Info
	api.HandleFunc("/health", s.healthHandler).Methods("GET")
	api.HandleFunc("/status", s.statusHandler).Methods("GET")
	api.HandleFunc("/chain-info", s.chainInfoHandler).Methods("GET")

	// Contract Management (compatibility with Python backend)
	api.HandleFunc("/contracts/status", s.contractStatusHandler).Methods("GET")
	api.HandleFunc("/contracts/addresses", s.contractAddressesHandler).Methods("GET")
	api.HandleFunc("/verify-contract", s.verifyContractHandler).Methods("GET")
	api.HandleFunc("/contract-info", s.contractInfoHandler).Methods("GET")

	// Plots API (specific routes before parameterized routes)
	api.HandleFunc("/plots/available", s.availablePlotsHandler).Methods("GET")
	api.HandleFunc("/plots/matrix", s.plotMatrixHandler).Methods("GET")
	api.HandleFunc("/plots/save", s.savePlotHandler).Methods("POST")
	api.HandleFunc("/plots/owned/{address}", s.ownedPlotsHandler).Methods("GET")
	api.HandleFunc("/plots/{id:[0-9]+}/buy", s.buyPlotHandler).Methods("POST")
	api.HandleFunc("/plots/{id:[0-9]+}/upgrade", s.upgradePlotHandler).Methods("POST")
	api.HandleFunc("/plots/{id:[0-9]+}/transfer", s.transferPlotHandler).Methods("POST")
	api.HandleFunc("/plots/{id:[0-9]+}", s.plotDetailsHandler).Methods("GET")

	// Marketplace
	api.HandleFunc("/marketplace", s.marketplaceHandler).Methods("GET")

	// NPCs API
	api.HandleFunc("/npcs", s.listNPCsHandler).Methods("GET")
	api.HandleFunc("/npcs/spawn", s.spawnNPCHandler).Methods("POST")
	api.HandleFunc("/npcs/{id}", s.getNPCHandler).Methods("GET")
	api.HandleFunc("/npcs/{id}/train", s.trainNPCHandler).Methods("POST")
	api.HandleFunc("/npcs/{id}/assign", s.assignNPCHandler).Methods("POST")
	api.HandleFunc("/npcs/{id}/relocate", s.relocateNPCHandler).Methods("POST")
	api.HandleFunc("/npcs/evolve", s.evolveNPCHandler).Methods("POST")

	// Cities API
	api.HandleFunc("/city", s.listCitiesHandler).Methods("GET")
	api.HandleFunc("/city/create", s.createCityHandler).Methods("POST")
	api.HandleFunc("/city/{name}", s.getCityHandler).Methods("GET")
	api.HandleFunc("/city/{name}/economy", s.updateCityEconomyHandler).Methods("POST")
	api.HandleFunc("/city/{name}/stats", s.cityStatsHandler).Methods("GET")

	// Economy API
	api.HandleFunc("/economy/stats", s.economyStatsHandler).Methods("GET")
	api.HandleFunc("/economy/prices", s.tokenPricesHandler).Methods("GET")
	api.HandleFunc("/economy/swap", s.swapTokensHandler).Methods("POST")

	// Treasury API
	api.HandleFunc("/treasury", s.treasuryHandler).Methods("GET")
	api.HandleFunc("/treasury/deposit", s.depositHandler).Methods("POST")
	api.HandleFunc("/treasury/withdraw", s.withdrawHandler).Methods("POST")

	// Admin API (for testing/development)
	api.HandleFunc("/admin/mint", s.adminMintHandler).Methods("POST")

	// Balances & Transfers
	api.HandleFunc("/balance/{address}", s.balanceHandler).Methods("GET")
	api.HandleFunc("/balance/{address}/{token}", s.tokenBalanceHandler).Methods("GET")
	api.HandleFunc("/transfer", s.transferHandler).Methods("POST")
	api.HandleFunc("/wallet/{address}/balance", s.walletBalanceHandler).Methods("GET")

	// Governance API
	api.HandleFunc("/governance/proposals", s.listProposalsHandler).Methods("GET")
	api.HandleFunc("/governance/proposal/{id}", s.getProposalHandler).Methods("GET")
	api.HandleFunc("/governance/proposal/create", s.createProposalHandler).Methods("POST")
	api.HandleFunc("/governance/proposal/{id}/vote", s.voteProposalHandler).Methods("POST")

	// Portfolio API
	api.HandleFunc("/portfolio/{address}", s.portfolioHandler).Methods("GET")

	// Account Management
	api.HandleFunc("/accounts", s.listAccountsHandler).Methods("GET")
	api.HandleFunc("/accounts/{address}", s.getAccountHandler).Methods("GET")

	// ChaosStar specific endpoints
	api.HandleFunc("/chaosstar/matrix", s.matrixHandler).Methods("GET")
	api.HandleFunc("/chaosstar/balance/{address}", s.chaosstarBalanceHandler).Methods("GET")
	api.HandleFunc("/chaosstar/transfer", s.chaosstarTransferHandler).Methods("POST")
	api.HandleFunc("/chaosstar/stargate/status", s.stargateStatusHandler).Methods("GET")

	// IPFS/Document handling
	api.HandleFunc("/ipfs/upload", s.ipfsUploadHandler).Methods("POST")
	api.HandleFunc("/documents/deed/{plotId}", s.generateDeedHandler).Methods("GET")

	// PDF Processing
	api.HandleFunc("/pdf/templates", s.pdfTemplatesHandler).Methods("GET")
	api.HandleFunc("/pdf/template/{id}", s.pdfTemplateHandler).Methods("GET")
	api.HandleFunc("/pdf/scan/{id}", s.pdfScanHandler).Methods("GET")
	api.HandleFunc("/pdf/fill/{id}", s.pdfFillHandler).Methods("POST")
	api.HandleFunc("/pdf/preview/{id}", s.pdfPreviewHandler).Methods("GET")
	api.HandleFunc("/pdf/overlay/{id}", s.pdfOverlayHandler).Methods("GET")
	api.HandleFunc("/pdf/download/{filename}", s.pdfDownloadHandler).Methods("GET")
	api.HandleFunc("/pdf/certificate/generate", s.generateCertificateHandler).Methods("POST")

	// Celestial Forge - Star Systems & Planets (native blockchain)
	api.HandleFunc("/celestial-forge/star-systems", s.listStarSystemsHandler).Methods("GET")
	api.HandleFunc("/celestial-forge/star-systems/create", s.createStarSystemHandler).Methods("POST")
	api.HandleFunc("/celestial-forge/star-systems/{id}", s.getStarSystemHandler).Methods("GET")
	api.HandleFunc("/celestial-forge/star-systems/{id}/update", s.updateStarSystemHandler).Methods("POST")
	api.HandleFunc("/celestial-forge/star-systems/{id}/deploy", s.deployStarSystemHandler).Methods("POST")
	api.HandleFunc("/celestial-forge/star-systems/{id}/delete", s.deleteStarSystemHandler).Methods("DELETE")
	api.HandleFunc("/celestial-forge/planets", s.listPlanetsHandler).Methods("GET")
	api.HandleFunc("/celestial-forge/planets/create", s.createPlanetHandler).Methods("POST")
	api.HandleFunc("/celestial-forge/planets/{id}", s.getPlanetHandler).Methods("GET")
	api.HandleFunc("/celestial-forge/planets/{id}/update", s.updatePlanetHandler).Methods("POST")
	api.HandleFunc("/celestial-forge/planets/{id}/delete", s.deletePlanetHandler).Methods("DELETE")
	api.HandleFunc("/celestial-forge/stats", s.celestialForgeStatsHandler).Methods("GET")
	api.HandleFunc("/celestial-forge/tools-status", s.forgeToolsStatusHandler).Methods("GET")

	// Sync endpoint (compatibility)
	api.HandleFunc("/sync/{address}", s.syncHandler).Methods("POST")

	// Root endpoint
	api.HandleFunc("", s.apiRootHandler).Methods("GET")
	api.HandleFunc("/", s.apiRootHandler).Methods("GET")

	// Serve frontend (catch-all - must be last)
	s.router.PathPrefix("/").Handler(http.FileServer(http.Dir(s.config.FrontendDir)))
}

// Start starts the server
func (s *Server) Start() error {
	var handler http.Handler = s.router

	// Enable CORS if configured
	if s.config.EnableCORS {
		handler = cors.New(cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
			AllowedHeaders:   []string{"*"},
			AllowCredentials: true,
			MaxAge:           86400,
		}).Handler(s.router)
	}

	s.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", s.config.Port),
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Initialize data store
	s.store.Initialize()

	log.Printf("🚀 ChaosStar Backend starting on port %d", s.config.Port)
	log.Printf("   HyperRPC: %s", s.config.HyperRPC)
	log.Printf("   Stargate: %s", s.config.StargateURL)
	log.Printf("   Chain ID: %d", s.config.ChainID)
	log.Printf("   Frontend: %s", s.config.FrontendDir)

	return s.httpServer.ListenAndServe()
}

// Stop gracefully stops the server
func (s *Server) Stop() error {
	if s.httpServer != nil {
		return s.httpServer.Close()
	}
	return nil
}

func main() {
	// Load configuration from environment
	config := DefaultConfig()

	if port := os.Getenv("PORT"); port != "" {
		config.Port, _ = strconv.Atoi(port)
	}
	if rpc := os.Getenv("HYPER_RPC"); rpc != "" {
		config.HyperRPC = rpc
	}
	if stargate := os.Getenv("STARGATE_URL"); stargate != "" {
		config.StargateURL = stargate
	}
	if frontend := os.Getenv("FRONTEND_DIR"); frontend != "" {
		config.FrontendDir = frontend
	}
	if chainID := os.Getenv("CHAIN_ID"); chainID != "" {
		config.ChainID, _ = strconv.ParseUint(chainID, 10, 64)
	}
	if blockchainID := os.Getenv("BLOCKCHAIN_ID"); blockchainID != "" {
		config.BlockchainID = blockchainID
	}

	// Create server
	server, err := NewServer(config)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down server...")
		server.Stop()
		os.Exit(0)
	}()

	// Start server
	if err := server.Start(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

