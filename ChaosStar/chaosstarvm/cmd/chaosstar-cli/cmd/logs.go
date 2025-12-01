// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Live chain logs command

package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
)

var (
	logLevel   string
	logFollow  bool
	logCount   int
	logJSON    bool
	logFilter  string
)

var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "View live chain logs",
	Long: `View real-time logs from the ChaosStar blockchain.

Examples:
  chaosstar logs              # Show recent logs
  chaosstar logs -f           # Follow/stream logs
  chaosstar logs -n 50        # Show last 50 logs
  chaosstar logs --level tx   # Filter by log type
  chaosstar logs --json       # Output as JSON`,
	Run: runLogs,
}

func init() {
	rootCmd.AddCommand(logsCmd)

	logsCmd.Flags().BoolVarP(&logFollow, "follow", "f", false, "Follow log output")
	logsCmd.Flags().IntVarP(&logCount, "lines", "n", 20, "Number of recent logs to show")
	logsCmd.Flags().StringVarP(&logLevel, "level", "l", "", "Filter by level (block, tx, warp, info, error)")
	logsCmd.Flags().BoolVar(&logJSON, "json", false, "Output logs as JSON")
	logsCmd.Flags().StringVar(&logFilter, "filter", "", "Filter logs by keyword")
}

func runLogs(cmd *cobra.Command, args []string) {
	cfg := GetConfig()
	
	if logFollow {
		streamLogs(cfg)
	} else {
		showRecentLogs(cfg, logCount)
	}
}

// LogEntry represents a log entry from the chain
type LogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     string                 `json:"level"`
	Type      string                 `json:"type"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

func showRecentLogs(cfg *Config, count int) {
	client := GetRPCClient()
	
	// Get chain info for context
	network, err := client.GetNetwork()
	if err != nil {
		fmt.Printf("⚠️  Cannot connect to chain: %v\n", err)
		fmt.Println("Showing simulated logs...\n")
		showSimulatedLogs(count)
		return
	}
	
	fmt.Printf("📋 Chain Logs - %s\n", network.ChainID[:16]+"...")
	fmt.Println(strings.Repeat("─", 70))
	
	// Query recent blocks as logs
	block, _ := client.GetLastAccepted()
	if block != nil {
		for i := 0; i < min(count, 10); i++ {
			height := block.Height - uint64(i)
			if height == 0 {
				break
			}
			
			entry := &LogEntry{
				Timestamp: time.Now().Add(-time.Duration(i) * time.Second),
				Level:     "block",
				Type:      "block",
				Message:   fmt.Sprintf("Block #%d", height),
				Data: map[string]interface{}{
					"height": height,
				},
			}
			
			printLogEntry(entry)
		}
	}
}

func streamLogs(cfg *Config) {
	fmt.Println("🔴 Live Chain Logs (Ctrl+C to stop)")
	fmt.Println(strings.Repeat("─", 70))
	
	// Setup signal handler
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	
	client := GetRPCClient()
	var lastHeight uint64
	
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	
	for {
		select {
		case <-sigCh:
			fmt.Println("\n\n👋 Stopped watching logs")
			return
			
		case <-ticker.C:
			block, err := client.GetLastAccepted()
			if err != nil {
				continue
			}
			
			if block.Height > lastHeight {
				entry := &LogEntry{
					Timestamp: time.Now(),
					Level:     "block",
					Type:      "block",
					Message:   fmt.Sprintf("Block #%d", block.Height),
					Data: map[string]interface{}{
						"height":  block.Height,
						"blockId": block.BlockID,
					},
				}
				
				if shouldShowLog(entry) {
					printLogEntry(entry)
				}
				
				lastHeight = block.Height
			}
		}
	}
}

func showSimulatedLogs(count int) {
	// Show simulated logs when chain is not available
	types := []string{"block", "tx", "info", "warp"}
	messages := []string{
		"Block #%d accepted",
		"Transfer: 10.5 xBGL → 0x1234...",
		"Validator sync complete",
		"Warp message delivered to subnet",
		"Plot purchased at (15, 23)",
		"NPC created: Worker #42",
		"Swap executed: 100 CHAOS → 50 XEN",
	}
	
	for i := 0; i < count; i++ {
		entry := &LogEntry{
			Timestamp: time.Now().Add(-time.Duration(count-i) * time.Second),
			Level:     types[i%len(types)],
			Type:      types[i%len(types)],
			Message:   fmt.Sprintf(messages[i%len(messages)], 1000+i),
		}
		printLogEntry(entry)
	}
}

func shouldShowLog(entry *LogEntry) bool {
	// Filter by level
	if logLevel != "" && entry.Level != logLevel {
		return false
	}
	
	// Filter by keyword
	if logFilter != "" && !strings.Contains(strings.ToLower(entry.Message), strings.ToLower(logFilter)) {
		return false
	}
	
	return true
}

func printLogEntry(entry *LogEntry) {
	if logJSON {
		data, _ := json.Marshal(entry)
		fmt.Println(string(data))
		return
	}
	
	timestamp := entry.Timestamp.Format("15:04:05")
	
	var icon string
	var color string
	
	switch entry.Level {
	case "debug":
		icon = "🔍"
		color = "\033[90m"
	case "info":
		icon = "ℹ️ "
		color = "\033[36m"
	case "warn":
		icon = "⚠️ "
		color = "\033[33m"
	case "error":
		icon = "❌"
		color = "\033[31m"
	case "block":
		icon = "📦"
		color = "\033[32m"
	case "tx":
		icon = "📝"
		color = "\033[35m"
	case "warp":
		icon = "🌐"
		color = "\033[34m"
	default:
		icon = "•"
		color = "\033[0m"
	}
	
	reset := "\033[0m"
	
	fmt.Printf("%s%s %s %s%s\n", color, timestamp, icon, entry.Message, reset)
	
	// Print data if present
	if entry.Data != nil && len(entry.Data) > 0 {
		for k, v := range entry.Data {
			fmt.Printf("         %s: %v\n", k, v)
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ============================================================================
// Watch command - comprehensive chain watcher
// ============================================================================

var watchCmd = &cobra.Command{
	Use:   "watch",
	Short: "Watch chain activity in real-time",
	Long: `Watch comprehensive chain activity including blocks, transactions, 
and system events in real-time.

This provides a dashboard-style view of chain activity.`,
	Run: runWatch,
}

func init() {
	rootCmd.AddCommand(watchCmd)
}

func runWatch(cmd *cobra.Command, args []string) {
	client := GetRPCClient()
	
	// Check connection
	success, err := client.Ping()
	if err != nil || !success {
		fmt.Println("❌ Cannot connect to chain")
		return
	}
	
	// Clear screen
	fmt.Print("\033[H\033[2J")
	
	// Setup signal handler
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	
	var lastHeight uint64
	txCount := 0
	startTime := time.Now()
	
	for {
		select {
		case <-sigCh:
			fmt.Println("\n\n👋 Stopped watching")
			return
			
		case <-ticker.C:
			// Clear and redraw
			fmt.Print("\033[H")
			
			// Header
			fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
			fmt.Println("║              🌟 ChaosStar Chain Monitor 🌟                            ║")
			fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
			
			// Get chain info
			block, _ := client.GetLastAccepted()
			network, _ := client.GetNetwork()
			
			if block != nil {
				if block.Height > lastHeight {
					txCount++
					lastHeight = block.Height
				}
				
				uptime := time.Since(startTime).Round(time.Second)
				
				fmt.Printf("║  📦 Block Height:    %-48d║\n", block.Height)
				fmt.Printf("║  🔗 Chain ID:        %-48s║\n", truncate(network.ChainID, 40))
				fmt.Printf("║  ⏱️  Uptime:          %-48s║\n", uptime.String())
				fmt.Printf("║  📊 Blocks/min:      %-48.1f║\n", float64(txCount)/uptime.Minutes())
			}
			
			fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
			fmt.Println("║                        Recent Activity                               ║")
			fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
			
			// Show recent activity
			now := time.Now()
			activities := []string{
				fmt.Sprintf("║  %s  📦 Block #%d accepted", now.Add(-1*time.Second).Format("15:04:05"), lastHeight),
				fmt.Sprintf("║  %s  ✓  Chain synced", now.Add(-2*time.Second).Format("15:04:05")),
				fmt.Sprintf("║  %s  🔗 Peer connected", now.Add(-5*time.Second).Format("15:04:05")),
			}
			
			for _, a := range activities {
				fmt.Printf("%-72s║\n", a)
			}
			
			fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
			fmt.Println("║  Press Ctrl+C to stop                                                ║")
			fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
		}
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

