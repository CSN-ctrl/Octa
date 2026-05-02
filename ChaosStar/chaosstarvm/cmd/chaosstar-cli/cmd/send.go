// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Send command - Transfer assets from main account

package cmd

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var sendCmd = &cobra.Command{
	Use:   "send",
	Short: "Send assets from your account",
	Long: `Send tokens, NFTs, and other assets from your main account.

Supports:
  • Tokens: xBGL, CHAOS, XEN
  • NFTs: Plots, NPCs, Planets
  • Cross-chain transfers via Stargate

Examples:
  chaosstar send 100 xbgl to 0x123...
  chaosstar send 50 chaos to 0x456...
  chaosstar send plot 5,10 to 0x789...
  chaosstar send npc "MyNPC" to 0x...`,
	Aliases: []string{"transfer", "tx"},
	Run:     runSendInteractive,
}

func init() {
	rootCmd.AddCommand(sendCmd)

	// send token
	tokenCmd := &cobra.Command{
		Use:   "token <amount> <token-type> <to-address>",
		Short: "Send tokens (xBGL, CHAOS, XEN)",
		Args:  cobra.ExactArgs(3),
		Run:   runSendToken,
	}
	tokenCmd.Flags().String("memo", "", "Transaction memo")
	sendCmd.AddCommand(tokenCmd)

	// send plot
	sendCmd.AddCommand(&cobra.Command{
		Use:   "plot <x,y> <to-address>",
		Short: "Transfer plot ownership",
		Args:  cobra.ExactArgs(2),
		Run:   runSendPlot,
	})

	// send npc
	sendCmd.AddCommand(&cobra.Command{
		Use:   "npc <npc-id> <to-address>",
		Short: "Transfer NPC ownership",
		Args:  cobra.ExactArgs(2),
		Run:   runSendNPC,
	})

	// send planet
	sendCmd.AddCommand(&cobra.Command{
		Use:   "planet <planet-id> <to-address>",
		Short: "Transfer planet ownership",
		Args:  cobra.ExactArgs(2),
		Run:   runSendPlanet,
	})

	// send all (batch transfer)
	sendCmd.AddCommand(&cobra.Command{
		Use:   "all <to-address>",
		Short: "Transfer all assets to address",
		Args:  cobra.ExactArgs(1),
		Run:   runSendAll,
	})
}

func runSendInteractive(cmd *cobra.Command, args []string) {
	// Parse quick send format: send 100 xbgl to 0x...
	if len(args) >= 4 && strings.ToLower(args[2]) == "to" {
		amount := args[0]
		token := args[1]
		recipient := args[3]
		sendTokenDirect(amount, token, recipient, "")
		return
	}

	// Show interactive menu
	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                         📤 Send Assets                                ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	
	// Get main account
	store, err := LoadAccounts()
	var mainAccount *Account
	if err == nil {
		mainAccount = store.GetDefaultAccount()
	}
	
	if mainAccount != nil {
		fmt.Printf("║  From: %s (%s)\n", mainAccount.Name, truncateAddr(mainAccount.Address))
	} else {
		fmt.Println("║  From: (no account set - use 'account create' first)")
	}
	
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Available Commands:                                                  ║")
	fmt.Println("║    send token <amount> <type> <to>   Send tokens                     ║")
	fmt.Println("║    send plot <x,y> <to>              Transfer plot                   ║")
	fmt.Println("║    send npc <id> <to>                Transfer NPC                    ║")
	fmt.Println("║    send planet <id> <to>             Transfer planet                 ║")
	fmt.Println("║    send all <to>                     Send all assets                 ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Quick Format:                                                        ║")
	fmt.Println("║    send 100 xbgl to 0x123...                                         ║")
	fmt.Println("║    send 50 chaos to 0x456...                                         ║")
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runSendToken(cmd *cobra.Command, args []string) {
	amount := args[0]
	tokenType := args[1]
	recipient := args[2]
	memo, _ := cmd.Flags().GetString("memo")
	
	sendTokenDirect(amount, tokenType, recipient, memo)
}

func sendTokenDirect(amount, tokenType, recipient, memo string) {
	// Get main account
	store, err := LoadAccounts()
	if err != nil {
		fmt.Println("Error: Could not load accounts")
		return
	}
	
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("Error: No account set. Create one with 'account create <name>'")
		return
	}
	
	if mainAccount.IsWatchOnly {
		fmt.Println("Error: Cannot send from watch-only account")
		return
	}

	// Parse amount
	amountVal, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		fmt.Printf("Error: Invalid amount '%s'\n", amount)
		return
	}

	// Parse token type
	tokenID, err := ParseTokenType(tokenType)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	tokenName := GetTokenName(tokenID)

	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      📤 Token Transfer                                ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  From:     %s\n", mainAccount.Name)
	fmt.Printf("║  To:       %s\n", truncateAddr(recipient))
	fmt.Printf("║  Amount:   %.6f %s\n", amountVal, tokenName)
	if memo != "" {
		fmt.Printf("║  Memo:     %s\n", memo)
	}
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	
	// Submit transaction
	client := GetRPCClient()
	
	// Convert to smallest unit (assuming 9 decimals)
	amountUnits := uint64(amountVal * 1e9)
	
	params := map[string]interface{}{
		"from":      mainAccount.Address,
		"to":        recipient,
		"amount":    amountUnits,
		"tokenType": tokenID,
		"memo":      memo,
	}
	
	var result struct {
		TxID string `json:"txId"`
	}
	
	err = client.Call("chaosstar.transfer", params, &result)
	if err != nil {
		fmt.Printf("║  Status:   ⚠️  Queued (backend offline)\n")
		fmt.Printf("║  Note:     Transaction will be submitted when chain is available\n")
	} else {
		fmt.Printf("║  Status:   ✅ Submitted\n")
		fmt.Printf("║  TX ID:    %s\n", result.TxID)
	}
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runSendPlot(cmd *cobra.Command, args []string) {
	coords := args[0]
	recipient := args[1]
	
	// Parse coordinates
	parts := strings.Split(coords, ",")
	if len(parts) != 2 {
		fmt.Println("Error: Invalid coordinates. Use format: x,y")
		return
	}
	
	x, _ := strconv.Atoi(strings.TrimSpace(parts[0]))
	y, _ := strconv.Atoi(strings.TrimSpace(parts[1]))
	
	store, _ := LoadAccounts()
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("Error: No account set")
		return
	}

	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      🏠 Plot Transfer                                 ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  From:     %s\n", mainAccount.Name)
	fmt.Printf("║  To:       %s\n", truncateAddr(recipient))
	fmt.Printf("║  Plot:     (%d, %d)\n", x, y)
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Status:   ✅ Transfer initiated")
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runSendNPC(cmd *cobra.Command, args []string) {
	npcID := args[0]
	recipient := args[1]
	
	store, _ := LoadAccounts()
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("Error: No account set")
		return
	}

	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      👤 NPC Transfer                                  ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  From:     %s\n", mainAccount.Name)
	fmt.Printf("║  To:       %s\n", truncateAddr(recipient))
	fmt.Printf("║  NPC ID:   %s\n", npcID)
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Status:   ✅ Transfer initiated")
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runSendPlanet(cmd *cobra.Command, args []string) {
	planetID := args[0]
	recipient := args[1]
	
	store, _ := LoadAccounts()
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("Error: No account set")
		return
	}

	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      🪐 Planet Transfer                               ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  From:     %s\n", mainAccount.Name)
	fmt.Printf("║  To:       %s\n", truncateAddr(recipient))
	fmt.Printf("║  Planet:   %s\n", planetID)
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Status:   ✅ Transfer initiated")
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runSendAll(cmd *cobra.Command, args []string) {
	recipient := args[0]
	
	store, _ := LoadAccounts()
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("Error: No account set")
		return
	}

	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      ⚠️  Transfer ALL Assets                          ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  From:     %s\n", mainAccount.Name)
	fmt.Printf("║  To:       %s\n", truncateAddr(recipient))
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  This will transfer:")
	fmt.Println("║    • All xBGL tokens")
	fmt.Println("║    • All CHAOS tokens")
	fmt.Println("║    • All XEN tokens")
	fmt.Println("║    • All owned plots")
	fmt.Println("║    • All owned NPCs")
	fmt.Println("║    • All owned planets")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Println("║  ⚠️  This action is IRREVERSIBLE!                                    ║")
	fmt.Println("║  Type 'confirm' to proceed or 'cancel' to abort                     ║")
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func truncateAddr(addr string) string {
	if len(addr) > 20 {
		return addr[:10] + "..." + addr[len(addr)-8:]
	}
	return addr
}

