// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Octavia Nebula Core integration commands

package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
)

var (
	octaviaBackendPID int
	octaviaBaseURL    = "http://localhost:5000"
)

var octaviaCmd = &cobra.Command{
	Use:   "octavia",
	Short: "Octavia Nebula Core management",
	Long: `Manage the Octavia Nebula Core - ChaosStar's land registry and game UI.

This integrates the Octavia frontend with the ChaosStar blockchain backend,
providing native HyperSDK connectivity for plots, NPCs, cities, and more.

Quick Start:
  octavia start          Start the backend server
  octavia status         Check if backend is running
  octavia plots          List available plots
  octavia treasury       View treasury balances`,
	Aliases: []string{"oct", "nebula", "o"},
}

func init() {
	rootCmd.AddCommand(octaviaCmd)

	// ========== Server Management ==========
	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start Octavia backend server",
		Long: `Start the ChaosStar-native Octavia backend server.

The server provides REST API endpoints for the frontend and
connects directly to the ChaosStar blockchain via HyperSDK RPC.`,
		Run: runOctaviaStart,
	}
	startCmd.Flags().IntP("port", "p", 5000, "Backend port")
	startCmd.Flags().String("frontend", "", "Frontend dist directory")
	startCmd.Flags().BoolP("background", "b", false, "Run in background")
	octaviaCmd.AddCommand(startCmd)

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "stop",
		Short: "Stop Octavia backend server",
		Run:   runOctaviaStop,
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "restart",
		Short: "Restart Octavia backend server",
		Run:   runOctaviaRestart,
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "status",
		Short: "Check Octavia backend status",
		Run:   runOctaviaStatus,
	})

	// ========== Configuration ==========
	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "config",
		Short: "Show Octavia configuration",
		Run:   runOctaviaConfig,
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "setup",
		Short: "Setup Octavia frontend for ChaosStar",
		Run:   runOctaviaSetup,
	})

	// ========== Data Queries ==========
	plotsCmd := &cobra.Command{
		Use:   "plots [subcommand]",
		Short: "Manage plots",
		Run:   runOctaviaPlotsList,
	}
	plotsCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List available plots",
		Run:   runOctaviaPlotsList,
	})
	plotsCmd.AddCommand(&cobra.Command{
		Use:   "owned <address>",
		Short: "List plots owned by address",
		Run:   runOctaviaPlotsOwned,
	})
	plotsCmd.AddCommand(&cobra.Command{
		Use:   "info <id>",
		Short: "Get plot details",
		Run:   runOctaviaPlotInfo,
	})
	plotsCmd.AddCommand(&cobra.Command{
		Use:   "buy <id> <buyer-address>",
		Short: "Buy a plot",
		Run:   runOctaviaPlotBuy,
	})
	plotsCmd.AddCommand(&cobra.Command{
		Use:   "matrix",
		Short: "Show octagonal matrix visualization",
		Run:   runOctaviaMatrix,
	})
	octaviaCmd.AddCommand(plotsCmd)

	npcsCmd := &cobra.Command{
		Use:   "npcs [subcommand]",
		Short: "Manage NPCs",
		Run:   runOctaviaNPCsList,
	}
	npcsCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List all NPCs",
		Run:   runOctaviaNPCsList,
	})
	npcsCmd.AddCommand(&cobra.Command{
		Use:   "spawn <count> [cohort] [owner]",
		Short: "Spawn new NPCs",
		Run:   runOctaviaNPCSpawn,
	})
	npcsCmd.AddCommand(&cobra.Command{
		Use:   "info <id>",
		Short: "Get NPC details",
		Run:   runOctaviaNPCInfo,
	})
	octaviaCmd.AddCommand(npcsCmd)

	citiesCmd := &cobra.Command{
		Use:   "cities [subcommand]",
		Short: "Manage cities",
		Run:   runOctaviaCitiesList,
	}
	citiesCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List all cities",
		Run:   runOctaviaCitiesList,
	})
	citiesCmd.AddCommand(&cobra.Command{
		Use:   "create <name> <x> <y> <owner>",
		Short: "Create a new city",
		Run:   runOctaviaCityCreate,
	})
	citiesCmd.AddCommand(&cobra.Command{
		Use:   "info <name>",
		Short: "Get city details",
		Run:   runOctaviaCityInfo,
	})
	octaviaCmd.AddCommand(citiesCmd)

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "treasury",
		Short: "View treasury balances",
		Run:   runOctaviaTreasury,
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "economy",
		Short: "View economy statistics",
		Run:   runOctaviaEconomy,
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:     "balance <address>",
		Short:   "Get account balances",
		Run:     runOctaviaBalance,
		Aliases: []string{"bal"},
	})

	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "portfolio <address>",
		Short: "Get complete portfolio for address",
		Run:   runOctaviaPortfolio,
	})

	// ========== Governance ==========
	govCmd := &cobra.Command{
		Use:   "governance [subcommand]",
		Short: "Governance commands",
		Run:   runOctaviaProposals,
		Aliases: []string{"gov"},
	}
	govCmd.AddCommand(&cobra.Command{
		Use:   "proposals",
		Short: "List governance proposals",
		Run:   runOctaviaProposals,
	})
	govCmd.AddCommand(&cobra.Command{
		Use:   "create <title> <description> <proposer>",
		Short: "Create a proposal",
		Run:   runOctaviaProposalCreate,
	})
	octaviaCmd.AddCommand(govCmd)

	// ========== Build Commands ==========
	buildCmd := &cobra.Command{
		Use:   "build [target]",
		Short: "Build Octavia components",
		Long: `Build Octavia backend or frontend.

Targets:
  backend   Build the Go backend
  frontend  Build the React frontend
  all       Build both (default)`,
		Run: runOctaviaBuildAll,
	}
	buildCmd.AddCommand(&cobra.Command{
		Use:   "backend",
		Short: "Build the Go backend",
		Run:   runOctaviaBuildBackend,
	})
	buildCmd.AddCommand(&cobra.Command{
		Use:   "frontend",
		Short: "Build the React frontend",
		Run:   runOctaviaBuildFrontend,
	})
	buildCmd.AddCommand(&cobra.Command{
		Use:   "all",
		Short: "Build both backend and frontend",
		Run:   runOctaviaBuildAll,
	})
	octaviaCmd.AddCommand(buildCmd)

	// ========== Frontend Dev ==========
	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "dev",
		Short: "Start frontend development server",
		Run:   runOctaviaDev,
	})

	// ========== Logs ==========
	logsCmd := &cobra.Command{
		Use:   "logs",
		Short: "Show backend logs",
		Run:   runOctaviaLogs,
	}
	logsCmd.Flags().BoolP("follow", "f", false, "Follow logs")
	logsCmd.Flags().IntP("lines", "n", 50, "Number of lines")
	octaviaCmd.AddCommand(logsCmd)

	// ========== API Testing ==========
	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "api <endpoint>",
		Short: "Call Octavia API endpoint",
		Long: `Make a GET request to an Octavia API endpoint.

Examples:
  octavia api health
  octavia api contract-info
  octavia api plots/available
  octavia api treasury`,
		Run: runOctaviaAPI,
	})

	// ========== Stargate Integration ==========
	octaviaCmd.AddCommand(&cobra.Command{
		Use:   "stargate",
		Short: "Show Stargate (MetaMask) connection info",
		Run:   runOctaviaStargate,
	})
}

// ============================================================================
// Helper Functions
// ============================================================================

func getOctaviaPath() string {
	paths := []string{
		filepath.Join(os.Getenv("HOME"), "Videos/ChaosStar/chaosstarvm"),
		".",
		"..",
	}
	for _, p := range paths {
		if _, err := os.Stat(filepath.Join(p, "backend")); err == nil {
			return p
		}
	}
	return paths[0]
}

func getOctaviaFrontendPath() string {
	paths := []string{
		filepath.Join(os.Getenv("HOME"), "Videos/ChaosStar/chaosstarvm/octavia-nebula-core"),
		"./octavia-nebula-core",
		"../octavia-nebula-core",
	}
	for _, p := range paths {
		if _, err := os.Stat(filepath.Join(p, "package.json")); err == nil {
			return p
		}
	}
	return paths[0]
}

func octaviaAPICall(endpoint string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/%s", octaviaBaseURL, strings.TrimPrefix(endpoint, "/"))
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func octaviaAPIPOST(endpoint string, data interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/%s", octaviaBaseURL, strings.TrimPrefix(endpoint, "/"))
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func isOctaviaRunning() bool {
	_, err := octaviaAPICall("health")
	return err == nil
}

func printBox(title string, content []string) {
	width := 70
	fmt.Println()
	fmt.Printf("╔%s╗\n", strings.Repeat("═", width))
	fmt.Printf("║  %-*s║\n", width-2, title)
	fmt.Printf("╠%s╣\n", strings.Repeat("═", width))
	for _, line := range content {
		fmt.Printf("║  %-*s║\n", width-2, line)
	}
	fmt.Printf("╚%s╝\n", strings.Repeat("═", width))
}

// ============================================================================
// Server Management
// ============================================================================

func runOctaviaStart(cmd *cobra.Command, args []string) {
	port, _ := cmd.Flags().GetInt("port")
	frontendDir, _ := cmd.Flags().GetString("frontend")
	background, _ := cmd.Flags().GetBool("background")

	if isOctaviaRunning() {
		fmt.Println("⚠️  Octavia backend is already running!")
		fmt.Println("   Use 'octavia restart' to restart or 'octavia stop' to stop.")
		return
	}

	cfg := GetConfig()
	_, blockchainID := parseRPCEndpoint(cfg.RPCEndpoint)

	basePath := getOctaviaPath()
	backendPath := filepath.Join(basePath, "backend")
	binaryPath := filepath.Join(basePath, "build", "chaosstar-backend")

	if frontendDir == "" {
		frontendDir = filepath.Join(basePath, "octavia-nebula-core", "dist")
	}

	octaviaBaseURL = fmt.Sprintf("http://localhost:%d", port)

	content := []string{
		fmt.Sprintf("Port:          %d", port),
		fmt.Sprintf("Frontend:      %s", frontendDir),
		fmt.Sprintf("ChaosStar RPC: %s", cfg.RPCEndpoint),
		fmt.Sprintf("Blockchain ID: %s...", blockchainID[:20]),
		"",
		"API Endpoints:",
		fmt.Sprintf("  Health:      http://localhost:%d/api/health", port),
		fmt.Sprintf("  Plots:       http://localhost:%d/api/plots/available", port),
		fmt.Sprintf("  NPCs:        http://localhost:%d/api/npcs", port),
		fmt.Sprintf("  Treasury:    http://localhost:%d/api/treasury", port),
		"",
		fmt.Sprintf("Frontend:      http://localhost:%d", port),
	}
	printBox("🌌 Octavia Nebula Core - Starting", content)

	// Set environment
	env := os.Environ()
	env = append(env, fmt.Sprintf("PORT=%d", port))
	env = append(env, fmt.Sprintf("HYPER_RPC=%s", cfg.RPCEndpoint))
	env = append(env, fmt.Sprintf("FRONTEND_DIR=%s", frontendDir))
	env = append(env, fmt.Sprintf("CHAIN_ID=%d", 8888))
	env = append(env, fmt.Sprintf("BLOCKCHAIN_ID=%s", blockchainID))

	var goCmd *exec.Cmd
	
	// Try to run binary first, fall back to go run
	if _, err := os.Stat(binaryPath); err == nil {
		goCmd = exec.Command(binaryPath)
		goCmd.Env = env
	} else {
		goCmd = exec.Command("go", "run", ".")
		goCmd.Dir = backendPath
		goCmd.Env = env
	}

	if background {
		goCmd.Stdout = nil
		goCmd.Stderr = nil
		if err := goCmd.Start(); err != nil {
			fmt.Printf("❌ Error starting backend: %v\n", err)
			return
		}
		octaviaBackendPID = goCmd.Process.Pid
		fmt.Printf("\n✅ Backend started in background (PID: %d)\n", octaviaBackendPID)
		fmt.Println("   Use 'octavia status' to check status")
		fmt.Println("   Use 'octavia stop' to stop the server")
		return
	}

	goCmd.Stdout = os.Stdout
	goCmd.Stderr = os.Stderr

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n\n🛑 Shutting down Octavia backend...")
		if goCmd.Process != nil {
			goCmd.Process.Kill()
		}
		os.Exit(0)
	}()

	fmt.Println("\nPress Ctrl+C to stop\n")

	if err := goCmd.Run(); err != nil {
		if !strings.Contains(err.Error(), "signal: killed") {
			fmt.Printf("❌ Error: %v\n", err)
		}
	}
}

func runOctaviaStop(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("ℹ️  Octavia backend is not running")
		return
	}

	// Try to kill by finding process
	killCmd := exec.Command("pkill", "-f", "chaosstar-backend")
	killCmd.Run()

	killCmd = exec.Command("pkill", "-f", "go run.*backend")
	killCmd.Run()

	time.Sleep(500 * time.Millisecond)

	if isOctaviaRunning() {
		fmt.Println("⚠️  Could not stop backend automatically")
		fmt.Println("   Try: pkill -f chaosstar-backend")
	} else {
		fmt.Println("✅ Octavia backend stopped")
	}
}

func runOctaviaRestart(cmd *cobra.Command, args []string) {
	fmt.Println("🔄 Restarting Octavia backend...")
	runOctaviaStop(cmd, args)
	time.Sleep(time.Second)
	runOctaviaStart(cmd, args)
}

func runOctaviaStatus(cmd *cobra.Command, args []string) {
	var content []string

	// Check backend
	health, err := octaviaAPICall("health")
	if err != nil {
		content = append(content, "🔴 Backend:     NOT RUNNING")
		content = append(content, "")
		content = append(content, "Start with: octavia start")
	} else {
		content = append(content, "🟢 Backend:     RUNNING")
		
		if status, ok := health["status"].(string); ok {
			content = append(content, fmt.Sprintf("   Status:      %s", status))
		}
		if chainID, ok := health["chain_id"].(float64); ok {
			content = append(content, fmt.Sprintf("   Chain ID:    %.0f", chainID))
		}
		if connected, ok := health["contract_connected"].(bool); ok {
			if connected {
				content = append(content, "   ChaosStar:   🟢 Connected")
			} else {
				content = append(content, "   ChaosStar:   🟡 Disconnected (mock mode)")
			}
		}
		if sgConnected, ok := health["stargate_connected"].(bool); ok {
			if sgConnected {
				content = append(content, "   Stargate:    🟢 Connected")
			} else {
				content = append(content, "   Stargate:    ⚫ Not running")
			}
		}

		// Get contract info
		info, err := octaviaAPICall("contract-info")
		if err == nil {
			content = append(content, "")
			if total, ok := info["total_plots"].(float64); ok {
				sold, _ := info["plots_sold"].(float64)
				content = append(content, fmt.Sprintf("   Plots:       %.0f/%.0f sold", sold, total))
			}
		}
	}

	printBox("Octavia Status", content)
}

// ============================================================================
// Configuration
// ============================================================================

func runOctaviaConfig(cmd *cobra.Command, args []string) {
	cfg := GetConfig()
	baseURL, blockchainID := parseRPCEndpoint(cfg.RPCEndpoint)

	content := []string{
		fmt.Sprintf("ChaosStar RPC:  %s", cfg.RPCEndpoint),
		fmt.Sprintf("Base URL:       %s", baseURL),
		fmt.Sprintf("Blockchain ID:  %s", blockchainID),
		"",
		"Stargate (MetaMask):",
		fmt.Sprintf("  RPC URL:      %s/ext/bc/%s/rpc", baseURL, blockchainID),
		"  Chain ID:     8888",
		"  Symbol:       xBGL",
		"",
		"Frontend .env:",
		fmt.Sprintf("  VITE_API_URL=http://localhost:5000"),
		fmt.Sprintf("  VITE_CHAOSSTAR_RPC=%s", cfg.RPCEndpoint),
		"  VITE_CHAIN_ID=8888",
	}

	printBox("Octavia-ChaosStar Configuration", content)
}

func runOctaviaSetup(cmd *cobra.Command, args []string) {
	cfg := GetConfig()
	baseURL, blockchainID := parseRPCEndpoint(cfg.RPCEndpoint)

	fmt.Println("\n🔧 Setting up Octavia for ChaosStar...")

	frontendPath := getOctaviaFrontendPath()
	if _, err := os.Stat(frontendPath); err != nil {
		fmt.Println("❌ Octavia frontend not found at:", frontendPath)
		return
	}

	// Create .env file
	envContent := fmt.Sprintf(`# ChaosStar Network Configuration
VITE_API_URL=http://localhost:5000
VITE_CHAOSSTAR_RPC=%s
VITE_STARGATE_RPC=%s/ext/bc/%s/rpc
VITE_CHAIN_ID=8888
VITE_BLOCKCHAIN_ID=%s
VITE_NETWORK_NAME=ChaosStar Network
VITE_NATIVE_TOKEN=xBGL
`, cfg.RPCEndpoint, baseURL, blockchainID, blockchainID)

	envPath := filepath.Join(frontendPath, ".env")
	if err := os.WriteFile(envPath, []byte(envContent), 0644); err != nil {
		fmt.Printf("❌ Failed to write .env: %v\n", err)
		return
	}

	fmt.Println("✅ Created .env file")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("  1. cd", frontendPath)
	fmt.Println("  2. npm install")
	fmt.Println("  3. npm run build")
	fmt.Println("  4. octavia start")
}

// ============================================================================
// Data Queries
// ============================================================================

func runOctaviaPlotsList(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running. Start with: octavia start")
		return
	}

	data, err := octaviaAPICall("plots/available?limit=10")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	// Handle array response
	plots, ok := data[""].([]interface{})
	if !ok {
		// Try direct array from raw response
		fmt.Println("\n📍 Available Plots (showing first 10):")
		fmt.Println(strings.Repeat("─", 60))
		fmt.Printf("%-8s %-10s %-10s %-12s %s\n", "ID", "X", "Y", "Price", "District")
		fmt.Println(strings.Repeat("─", 60))
		
		// Re-fetch with raw handling
		url := fmt.Sprintf("%s/api/plots/available?limit=10", octaviaBaseURL)
		resp, err := http.Get(url)
		if err != nil {
			return
		}
		defer resp.Body.Close()
		
		body, _ := io.ReadAll(resp.Body)
		var plotsArr []map[string]interface{}
		json.Unmarshal(body, &plotsArr)
		
		for _, plot := range plotsArr {
			id := fmt.Sprintf("%.0f", plot["plot_id"])
			x := fmt.Sprintf("%.0f", plot["x"])
			y := fmt.Sprintf("%.0f", plot["y"])
			price := fmt.Sprintf("%v", plot["price_xbgl"])
			district := ""
			if meta, ok := plot["metadata"].(map[string]interface{}); ok {
				district, _ = meta["district"].(string)
			}
			fmt.Printf("%-8s %-10s %-10s %-12s %s\n", id, x, y, price+" xBGL", district)
		}
		return
	}

	fmt.Println("\n📍 Available Plots:")
	for _, p := range plots {
		plot := p.(map[string]interface{})
		fmt.Printf("  Plot #%.0f at (%.0f, %.0f) - %v xBGL\n",
			plot["plot_id"], plot["x"], plot["y"], plot["price_xbgl"])
	}
}

func runOctaviaPlotsOwned(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia plots owned <address>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("plots/owned/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	plots, _ := data["plots"].([]interface{})
	if len(plots) == 0 {
		fmt.Println("No plots owned by this address")
		return
	}

	fmt.Printf("\n📍 Plots owned by %s:\n", args[0])
	for _, p := range plots {
		plot := p.(map[string]interface{})
		fmt.Printf("  Plot #%.0f at (%.0f, %.0f) - Level %.0f\n",
			plot["plot_id"], plot["x"], plot["y"], plot["level"])
	}
}

func runOctaviaPlotInfo(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia plots info <id>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("plots/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("ID:       %.0f", data["plot_id"]),
		fmt.Sprintf("Location: (%.0f, %.0f)", data["x"], data["y"]),
		fmt.Sprintf("Status:   %v", data["status"]),
		fmt.Sprintf("Price:    %v xBGL", data["price_xbgl"]),
		fmt.Sprintf("Level:    %.0f", data["level"]),
	}
	if owner, ok := data["owner"].(string); ok && owner != "" {
		content = append(content, fmt.Sprintf("Owner:    %s", owner))
	}
	if meta, ok := data["metadata"].(map[string]interface{}); ok {
		if district, ok := meta["district"].(string); ok {
			content = append(content, fmt.Sprintf("District: %s", district))
		}
	}

	printBox(fmt.Sprintf("Plot #%s", args[0]), content)
}

func runOctaviaPlotBuy(cmd *cobra.Command, args []string) {
	if len(args) < 2 {
		fmt.Println("Usage: octavia plots buy <id> <buyer-address>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPIPOST(fmt.Sprintf("plots/%s/buy", args[0]), map[string]string{
		"buyer": args[1],
	})
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	if success, ok := data["success"].(bool); ok && success {
		fmt.Printf("✅ Plot #%s purchased!\n", args[0])
		if txHash, ok := data["tx_hash"].(string); ok {
			fmt.Printf("   TX Hash: %s\n", txHash)
		}
	} else {
		fmt.Printf("❌ Purchase failed: %v\n", data["error"])
	}
}

func runOctaviaMatrix(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("plots/matrix?x=0&y=0&radius=5")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	fmt.Println("\n🗺️  Octagonal Matrix (centered at 0,0):")
	fmt.Println()

	if matrix, ok := data["matrix"].([]interface{}); ok {
		for _, row := range matrix {
			rowSlice := row.([]interface{})
			fmt.Print("    ")
			for _, cell := range rowSlice {
				fmt.Print(cell, " ")
			}
			fmt.Println()
		}
	}

	fmt.Println()
	if legend, ok := data["legend"].(map[string]interface{}); ok {
		fmt.Print("    Legend: ")
		for symbol, meaning := range legend {
			fmt.Printf("%s=%s  ", symbol, meaning)
		}
		fmt.Println()
	}
}

func runOctaviaNPCsList(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("npcs")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	npcs, _ := data["npcs"].([]interface{})
	if len(npcs) == 0 {
		fmt.Println("No NPCs found. Create some with: octavia npcs spawn <count>")
		return
	}

	fmt.Println("\n👥 NPCs:")
	fmt.Println(strings.Repeat("─", 80))
	fmt.Printf("%-36s %-12s %-10s %-10s %s\n", "ID", "Cohort", "Skill", "Loyalty", "Personality")
	fmt.Println(strings.Repeat("─", 80))
	
	for _, n := range npcs {
		npc := n.(map[string]interface{})
		fmt.Printf("%-36s %-12s %-10.1f %-10.1f %s\n",
			npc["id"], npc["cohort"], npc["skill"], npc["loyalty"], npc["personality"])
	}
}

func runOctaviaNPCSpawn(cmd *cobra.Command, args []string) {
	count := 1
	cohort := "child"
	owner := ""

	if len(args) >= 1 {
		count, _ = strconv.Atoi(args[0])
	}
	if len(args) >= 2 {
		cohort = args[1]
	}
	if len(args) >= 3 {
		owner = args[2]
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPIPOST("npcs/spawn", map[string]interface{}{
		"count":  count,
		"cohort": cohort,
		"owner":  owner,
	})
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	created, _ := data["created"].([]interface{})
	fmt.Printf("✅ Spawned %d NPCs\n", len(created))
	for _, n := range created {
		npc := n.(map[string]interface{})
		fmt.Printf("   %s - %s (%s)\n", npc["id"], npc["cohort"], npc["personality"])
	}
}

func runOctaviaNPCInfo(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia npcs info <id>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("npcs/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("ID:          %v", data["id"]),
		fmt.Sprintf("Cohort:      %v", data["cohort"]),
		fmt.Sprintf("Personality: %v", data["personality"]),
		fmt.Sprintf("Skill:       %.1f", data["skill"]),
		fmt.Sprintf("Loyalty:     %.1f", data["loyalty"]),
		fmt.Sprintf("Location:    (%.0f, %.0f)", data["location_x"], data["location_y"]),
	}
	if owner, ok := data["owner"].(string); ok && owner != "" {
		content = append(content, fmt.Sprintf("Owner:       %s", owner))
	}
	if task, ok := data["assigned_task"].(string); ok && task != "" {
		content = append(content, fmt.Sprintf("Task:        %s", task))
	}

	printBox("NPC Details", content)
}

func runOctaviaCitiesList(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("city")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	cities, _ := data["cities"].([]interface{})
	if len(cities) == 0 {
		fmt.Println("No cities found. Create one with: octavia cities create <name> <x> <y> <owner>")
		return
	}

	fmt.Println("\n🏙️ Cities:")
	fmt.Println(strings.Repeat("─", 70))
	fmt.Printf("%-20s %-15s %-10s %-10s %s\n", "Name", "Location", "Population", "Tax Rate", "Owner")
	fmt.Println(strings.Repeat("─", 70))
	
	for _, c := range cities {
		city := c.(map[string]interface{})
		location := fmt.Sprintf("(%.0f, %.0f)", city["location_x"], city["location_y"])
		owner := fmt.Sprintf("%v", city["owner"])
		if len(owner) > 15 {
			owner = owner[:12] + "..."
		}
		fmt.Printf("%-20s %-15s %-10.0f %-10.0f%% %s\n",
			city["name"], location, city["population"], city["tax_rate"], owner)
	}
}

func runOctaviaCityCreate(cmd *cobra.Command, args []string) {
	if len(args) < 4 {
		fmt.Println("Usage: octavia cities create <name> <x> <y> <owner>")
		return
	}

	x, _ := strconv.Atoi(args[1])
	y, _ := strconv.Atoi(args[2])

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPIPOST("city/create", map[string]interface{}{
		"name": args[0],
		"x":    x,
		"y":    y,
		"from": args[3],
	})
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	if success, ok := data["success"].(bool); ok && success {
		fmt.Printf("✅ City '%s' created at (%d, %d)!\n", args[0], x, y)
		if txHash, ok := data["tx_hash"].(string); ok {
			fmt.Printf("   TX Hash: %s\n", txHash)
		}
	} else {
		fmt.Printf("❌ Creation failed: %v\n", data["error"])
	}
}

func runOctaviaCityInfo(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia cities info <name>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("city/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("Name:       %v", data["name"]),
		fmt.Sprintf("Owner:      %v", data["owner"]),
		fmt.Sprintf("Location:   (%.0f, %.0f)", data["location_x"], data["location_y"]),
		fmt.Sprintf("Population: %.0f", data["population"]),
		fmt.Sprintf("Tax Rate:   %.0f%%", data["tax_rate"]),
		fmt.Sprintf("Treasury:   %.0f", data["treasury"]),
	}

	printBox(fmt.Sprintf("City: %s", args[0]), content)
}

func runOctaviaTreasury(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("treasury")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("Address:         %v", data["treasury_address"]),
		"",
		"Balances:",
		fmt.Sprintf("  xBGL:          %v", data["balance_xbgl"]),
		fmt.Sprintf("  CHAOS:         %v", data["balance_chaos"]),
		fmt.Sprintf("  XEN:           %v", data["balance_xen"]),
		"",
		fmt.Sprintf("Total Revenue:   %v xBGL", data["total_revenue_xbgl"]),
		fmt.Sprintf("Plots Sold:      %.0f", data["total_plots_sold"]),
	}

	printBox("🏦 Treasury", content)
}

func runOctaviaEconomy(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("economy/stats")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{}

	if prices, ok := data["token_prices"].(map[string]interface{}); ok {
		content = append(content, "Token Prices:")
		for token, price := range prices {
			content = append(content, fmt.Sprintf("  %-8s $%.4f", token, price))
		}
	}

	if supply, ok := data["total_supply"].(map[string]interface{}); ok {
		content = append(content, "")
		content = append(content, "Total Supply:")
		for token, amount := range supply {
			content = append(content, fmt.Sprintf("  %-8s %v", token, amount))
		}
	}

	printBox("📊 Economy Stats", content)
}

func runOctaviaBalance(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia balance <address>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("balance/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("Address: %s", args[0]),
		"",
	}

	if balances, ok := data["balances"].(map[string]interface{}); ok {
		content = append(content, "Balances:")
		for token, balance := range balances {
			content = append(content, fmt.Sprintf("  %-8s %v", token, balance))
		}
	}

	printBox("💰 Account Balance", content)
}

func runOctaviaPortfolio(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia portfolio <address>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(fmt.Sprintf("portfolio/%s", args[0]))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{
		fmt.Sprintf("Address: %s", args[0]),
		"",
	}

	if balances, ok := data["balances"].(map[string]interface{}); ok {
		content = append(content, "Balances:")
		for token, balance := range balances {
			content = append(content, fmt.Sprintf("  %-8s %v", token, balance))
		}
	}

	if totalPlots, ok := data["total_plots"].(float64); ok {
		content = append(content, "")
		content = append(content, fmt.Sprintf("Total Plots: %.0f", totalPlots))
	}

	printBox("📋 Portfolio", content)
}

func runOctaviaProposals(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("governance/proposals")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	proposals, _ := data["proposals"].([]interface{})
	if len(proposals) == 0 {
		fmt.Println("No active proposals")
		return
	}

	fmt.Println("\n📜 Governance Proposals:")
	fmt.Println(strings.Repeat("─", 80))
	
	for _, p := range proposals {
		prop := p.(map[string]interface{})
		fmt.Printf("  [%s] %s\n", prop["status"], prop["title"])
		fmt.Printf("    Votes: For %.0f / Against %.0f\n", prop["votes_for"], prop["votes_against"])
	}
}

func runOctaviaProposalCreate(cmd *cobra.Command, args []string) {
	if len(args) < 3 {
		fmt.Println("Usage: octavia governance create <title> <description> <proposer>")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPIPOST("governance/proposal/create", map[string]interface{}{
		"title":       args[0],
		"description": args[1],
		"proposer":    args[2],
		"duration":    604800, // 1 week
	})
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	if success, ok := data["success"].(bool); ok && success {
		fmt.Printf("✅ Proposal created: %s\n", args[0])
	} else {
		fmt.Printf("❌ Failed: %v\n", data["error"])
	}
}

// ============================================================================
// Build Commands
// ============================================================================

func runOctaviaBuildBackend(cmd *cobra.Command, args []string) {
	basePath := getOctaviaPath()
	buildScript := filepath.Join(basePath, "backend", "build.sh")

	fmt.Println("🔨 Building Octavia backend...")

	buildCmd := exec.Command("bash", buildScript)
	buildCmd.Dir = filepath.Join(basePath, "backend")
	buildCmd.Stdout = os.Stdout
	buildCmd.Stderr = os.Stderr

	if err := buildCmd.Run(); err != nil {
		fmt.Printf("❌ Build failed: %v\n", err)
		return
	}

	fmt.Println("✅ Backend build complete!")
}

func runOctaviaBuildFrontend(cmd *cobra.Command, args []string) {
	frontendPath := getOctaviaFrontendPath()

	fmt.Println("🔨 Building Octavia frontend...")

	buildCmd := exec.Command("npm", "run", "build")
	buildCmd.Dir = frontendPath
	buildCmd.Stdout = os.Stdout
	buildCmd.Stderr = os.Stderr

	if err := buildCmd.Run(); err != nil {
		fmt.Printf("❌ Build failed: %v\n", err)
		return
	}

	fmt.Println("✅ Frontend build complete!")
}

func runOctaviaBuildAll(cmd *cobra.Command, args []string) {
	runOctaviaBuildBackend(cmd, args)
	fmt.Println()
	runOctaviaBuildFrontend(cmd, args)
}

func runOctaviaDev(cmd *cobra.Command, args []string) {
	frontendPath := getOctaviaFrontendPath()

	fmt.Println("🚀 Starting Octavia frontend dev server...")
	fmt.Println("   Frontend:", frontendPath)
	fmt.Println()

	devCmd := exec.Command("npm", "run", "dev")
	devCmd.Dir = frontendPath
	devCmd.Stdout = os.Stdout
	devCmd.Stderr = os.Stderr

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n\n🛑 Stopping dev server...")
		if devCmd.Process != nil {
			devCmd.Process.Kill()
		}
		os.Exit(0)
	}()

	if err := devCmd.Run(); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
	}
}

func runOctaviaLogs(cmd *cobra.Command, args []string) {
	fmt.Println("📋 Backend logs:")
	fmt.Println("   (Logs are output to stdout when running 'octavia start')")
	fmt.Println("   For background mode, use: journalctl or redirect output")
}

func runOctaviaAPI(cmd *cobra.Command, args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: octavia api <endpoint>")
		fmt.Println("Examples:")
		fmt.Println("  octavia api health")
		fmt.Println("  octavia api contract-info")
		fmt.Println("  octavia api treasury")
		return
	}

	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall(args[0])
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	output, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(output))
}

func runOctaviaStargate(cmd *cobra.Command, args []string) {
	if !isOctaviaRunning() {
		fmt.Println("❌ Octavia backend is not running")
		return
	}

	data, err := octaviaAPICall("chaosstar/stargate/status")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	content := []string{}

	if running, ok := data["running"].(bool); ok {
		if running {
			content = append(content, "Status: 🟢 Running")
		} else {
			content = append(content, "Status: ⚫ Not running")
		}
	}

	if rpcURL, ok := data["rpc_url"].(string); ok {
		content = append(content, fmt.Sprintf("RPC URL: %s", rpcURL))
	}
	if chainID, ok := data["chain_id"].(float64); ok {
		content = append(content, fmt.Sprintf("Chain ID: %.0f", chainID))
	}

	content = append(content, "")
	content = append(content, "MetaMask Configuration:")

	if mmConfig, ok := data["metamask_config"].(map[string]interface{}); ok {
		content = append(content, fmt.Sprintf("  Network Name: %v", mmConfig["networkName"]))
		content = append(content, fmt.Sprintf("  RPC URL:      %v", mmConfig["rpcUrl"]))
		content = append(content, fmt.Sprintf("  Chain ID:     %.0f", mmConfig["chainId"]))
		content = append(content, fmt.Sprintf("  Symbol:       %v", mmConfig["currencySymbol"]))
	}

	printBox("🌉 Stargate (MetaMask Bridge)", content)
}
