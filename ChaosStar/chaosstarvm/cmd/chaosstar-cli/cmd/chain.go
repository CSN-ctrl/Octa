// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Chain interaction commands

package cmd

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

// Token type constants
const (
	TokenXBGL  uint8 = 0
	TokenChaos uint8 = 1
	TokenXen   uint8 = 2
)

// TokenNames maps token types to names
var TokenNames = map[uint8]string{
	TokenXBGL:  "xBGL",
	TokenChaos: "CHAOS",
	TokenXen:   "XEN",
}

// ParseTokenType parses a token name to type
func ParseTokenType(name string) (uint8, error) {
	switch strings.ToUpper(name) {
	case "XBGL", "0":
		return TokenXBGL, nil
	case "CHAOS", "1":
		return TokenChaos, nil
	case "XEN", "2":
		return TokenXen, nil
	default:
		return 0, fmt.Errorf("unknown token: %s (use xBGL, CHAOS, or XEN)", name)
	}
}

func init() {
	// chain ping
	chainCmd.AddCommand(&cobra.Command{
		Use:   "ping",
		Short: "Ping the chain",
		Run: func(cmd *cobra.Command, args []string) {
			client := GetRPCClient()
			
			start := time.Now()
			success, err := client.Ping()
			latency := time.Since(start)
			
			if err != nil {
				fmt.Printf("❌ Chain is not reachable: %v\n", err)
				return
			}
			
			if success {
				fmt.Printf("✓ Chain is online (latency: %v)\n", latency)
			} else {
				fmt.Println("❌ Chain ping failed")
			}
		},
	})

	// chain info
	chainCmd.AddCommand(&cobra.Command{
		Use:   "info",
		Short: "Get chain information",
		Run: func(cmd *cobra.Command, args []string) {
			client := GetRPCClient()
			
			network, err := client.GetNetwork()
			if err != nil {
				fmt.Printf("Error getting network info: %v\n", err)
				return
			}
			
			block, _ := client.GetLastAccepted()
			fee, _ := client.GetSuggestedFee()
			
			fmt.Println("Chain Information")
			fmt.Println(strings.Repeat("=", 60))
			fmt.Printf("  Network ID: %d\n", network.NetworkID)
			fmt.Printf("  Subnet ID:  %s\n", network.SubnetID)
			fmt.Printf("  Chain ID:   %s\n", network.ChainID)
			
			if block != nil {
				fmt.Println()
				fmt.Println("Latest Block")
				fmt.Println(strings.Repeat("-", 60))
				fmt.Printf("  Height:    %d\n", block.Height)
				fmt.Printf("  Block ID:  %s\n", block.BlockID)
				fmt.Printf("  Timestamp: %s\n", time.Unix(0, block.Timestamp).Format(time.RFC3339))
			}
			
			fmt.Println()
			fmt.Printf("Suggested Fee: %d\n", fee)
		},
	})

	// chain balance
	chainCmd.AddCommand(&cobra.Command{
		Use:   "balance [address]",
		Short: "Get balance for an address",
		Long:  "Get balance for an address. If no address provided, uses default key.",
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			var address string
			
			if len(args) > 0 {
				address = args[0]
			} else {
				// Use default key
				cfg := GetConfig()
				if cfg.DefaultKey == "" {
					fmt.Println("Error: No address provided and no default key set")
					fmt.Println("Use: chaosstar-cli chain balance <address>")
					fmt.Println("Or set a default key: chaosstar-cli config set-key <name>")
					return
				}
				
				keyInfo, err := LoadKey(cfg.DefaultKey)
				if err != nil {
					fmt.Printf("Error loading default key: %v\n", err)
					return
				}
				address = keyInfo.Address
			}
			
			client := GetRPCClient()
			
			fmt.Printf("Balances for %s\n", address)
			fmt.Println(strings.Repeat("=", 70))
			
			for tokenType := uint8(0); tokenType <= 2; tokenType++ {
				balance, err := client.GetBalance(address, tokenType)
				if err != nil {
					balance = 0
				}
				
				// Format balance (assuming 9 decimals)
				formatted := FormatBalance(balance, 9)
				fmt.Printf("  %-8s %s\n", TokenNames[tokenType]+":", formatted)
			}
		},
	})

	// chain treasury
	chainCmd.AddCommand(&cobra.Command{
		Use:   "treasury",
		Short: "Get treasury information",
		Run: func(cmd *cobra.Command, args []string) {
			client := GetRPCClient()
			
			fmt.Println("Treasury Balances")
			fmt.Println(strings.Repeat("=", 60))
			
			// Treasury address is typically a special address
			treasuryAddr := "treasury"
			
			for tokenType := uint8(0); tokenType <= 2; tokenType++ {
				balance, err := client.GetBalance(treasuryAddr, tokenType)
				if err != nil {
					balance = 0
				}
				
				formatted := FormatBalance(balance, 9)
				fmt.Printf("  %-8s %s\n", TokenNames[tokenType]+":", formatted)
			}
		},
	})

	// chain tx
	chainCmd.AddCommand(&cobra.Command{
		Use:   "tx [txid]",
		Short: "Get transaction status",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			txID := args[0]
			client := GetRPCClient()
			
			status, err := client.GetTxStatus(txID)
			if err != nil {
				fmt.Printf("Error getting transaction: %v\n", err)
				return
			}
			
			fmt.Printf("Transaction: %s\n", txID)
			fmt.Println(strings.Repeat("-", 60))
			
			if status.Confirmed {
				if status.Success {
					fmt.Println("  Status: ✓ Confirmed")
				} else {
					fmt.Println("  Status: ❌ Failed")
					if status.Error != "" {
						fmt.Printf("  Error:  %s\n", status.Error)
					}
				}
			} else {
				fmt.Println("  Status: ⏳ Pending")
			}
		},
	})

	// chain watch
	chainCmd.AddCommand(&cobra.Command{
		Use:   "watch",
		Short: "Watch for new blocks",
		Run: func(cmd *cobra.Command, args []string) {
			client := GetRPCClient()
			
			fmt.Println("Watching for new blocks (Ctrl+C to stop)...")
			fmt.Println()
			
			var lastHeight uint64
			
			for {
				block, err := client.GetLastAccepted()
				if err != nil {
					fmt.Printf("Error: %v\n", err)
					time.Sleep(2 * time.Second)
					continue
				}
				
				if block.Height > lastHeight {
					t := time.Unix(0, block.Timestamp)
					fmt.Printf("Block #%d | %s | %s\n", 
						block.Height,
						t.Format("15:04:05"),
						block.BlockID[:16]+"...",
					)
					lastHeight = block.Height
				}
				
				time.Sleep(500 * time.Millisecond)
			}
		},
	})
}

// FormatBalance formats a balance with decimals
func FormatBalance(balance uint64, decimals int) string {
	if balance == 0 {
		return "0.0"
	}
	
	divisor := uint64(1)
	for i := 0; i < decimals; i++ {
		divisor *= 10
	}
	
	whole := balance / divisor
	frac := balance % divisor
	
	if frac == 0 {
		return fmt.Sprintf("%d.0", whole)
	}
	
	// Format fraction with leading zeros
	fracStr := fmt.Sprintf("%0*d", decimals, frac)
	// Trim trailing zeros
	fracStr = strings.TrimRight(fracStr, "0")
	
	return fmt.Sprintf("%d.%s", whole, fracStr)
}

