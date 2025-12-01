// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Interactive shell mode

package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var shellCmd = &cobra.Command{
	Use:   "shell",
	Short: "Start interactive shell",
	Long:  "Start an interactive shell session for ChaosStar CLI",
	Run:   runShell,
}

func init() {
	rootCmd.AddCommand(shellCmd)
}

// StartShell starts the interactive shell (called from root command)
func StartShell() {
	runShell(nil, nil)
}

func runShell(cmd *cobra.Command, args []string) {
	printShellBanner()
	
	reader := bufio.NewReader(os.Stdin)
	cfg := GetConfig()
	
	for {
		// Print prompt
		prompt := "chaosstar"
		if cfg.DefaultKey != "" {
			prompt = fmt.Sprintf("chaosstar[%s]", cfg.DefaultKey)
		}
		fmt.Printf("\n%s> ", prompt)
		
		// Read input
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("\nGoodbye!")
			return
		}
		
		// Trim and parse input
		input = strings.TrimSpace(input)
		if input == "" {
			continue
		}
		
		// Handle special commands
		switch strings.ToLower(input) {
		case "exit", "quit", "q":
			fmt.Println("Goodbye! 👋")
			return
		case "help", "?":
			printShellHelp()
			continue
		case "clear", "cls":
			fmt.Print("\033[H\033[2J")
			printShellBanner()
			continue
		case "status":
			showStatus()
			continue
		case "back", "b":
			fmt.Print("\033[H\033[2J")
			printShellBanner()
			showQuickStatus()
			continue
		}
		
		// Parse command arguments
		cmdArgs := parseArgs(input)
		if len(cmdArgs) == 0 {
			continue
		}
		
		// Execute command
		executeShellCommand(cmdArgs)
		
		// Reload config in case it changed
		cfg = GetConfig()
	}
}

func printShellBanner() {
	fmt.Println(`
   _____ _                      _____ _             
  / ____| |                    / ____| |            
 | |    | |__   __ _  ___  ___| (___ | |_ __ _ _ __ 
 | |    | '_ \ / _' |/ _ \/ __|\___ \| __/ _' | '__|
 | |____| | | | (_| | (_) \__ \____) | || (_| | |   
  \_____|_| |_|\__,_|\___/|___/_____/ \__\__,_|_|   
                                                    
  Interactive Shell v` + Version + `
  
  Type 'help' for commands, 'exit' to quit`)
}

func printShellHelp() {
	fmt.Println(`
╔══════════════════════════════════════════════════════════════════════╗
║                        ChaosStar Shell Commands                       ║
╠══════════════════════════════════════════════════════════════════════╣
║ SHELL COMMANDS:                                                       ║
║   help, ?          Show this help                                     ║
║   status           Show connection and wallet status                  ║
║   back, b          Go back / return to main menu                      ║
║   clear, cls       Clear screen                                       ║
║   exit, quit, q    Exit shell                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║ LIVE MONITORING:                                                      ║
║   logs             Show recent chain logs                             ║
║   logs -f          Follow/stream live logs                            ║
║   logs --level tx  Filter logs by type (block, tx, warp, info)        ║
║   watch            Live chain activity dashboard                      ║
╠══════════════════════════════════════════════════════════════════════╣
║ ACCOUNT MANAGEMENT:                                                   ║
║   account list                   List all accounts                    ║
║   account create <name>          Create new account                   ║
║   account import <name> <key>    Import from private key              ║
║   account watch <name> <addr>    Add watch-only account               ║
║   account show [name]            Show account details                 ║
║   account use <name>             Switch to account                    ║
║   account balances               Show all account balances            ║
║   account export <name>          Export private key                   ║
║   account remove <name>          Remove account                       ║
╠══════════════════════════════════════════════════════════════════════╣
║ KEY MANAGEMENT:                                                       ║
║   key generate <name>           Create new key                        ║
║   key list                      List all keys                         ║
║   key show <name>               Show key details                      ║
║   key export <name>             Export private key                    ║
║   key delete <name>             Delete a key                          ║
╠══════════════════════════════════════════════════════════════════════╣
║ CONFIGURATION:                                                        ║
║   config show                   Show current config                   ║
║   config set-key <name>         Set default key                       ║
║   config set-endpoint <url>     Set RPC endpoint                      ║
╠══════════════════════════════════════════════════════════════════════╣
║ CHAIN QUERIES:                                                        ║
║   chain ping                    Check chain connection                ║
║   chain info                    Get chain information                 ║
║   chain balance [address]       Get balance (default: your address)   ║
║   chain tx <txid>               Get transaction status                ║
║   chain treasury                Get treasury balances                 ║
╠══════════════════════════════════════════════════════════════════════╣
║ ACTIONS (Transactions):                                               ║
║   action transfer <to> <amount> <token>     Transfer tokens           ║
║   action swap <from> <to> <amount>          Swap tokens               ║
║   action buy-plot <x> <y>                   Purchase plot             ║
║   action create-npc <name> <x> <y>          Create NPC                ║
║   action create-city <name> <x> <y>         Create city               ║
║   action create-star-system <name>          Create star system        ║
║   action create-planet <name> <system-id>   Create planet             ║
╠══════════════════════════════════════════════════════════════════════╣
║ OCTAGONAL MATRIX:                                                     ║
║   matrix size                    Get matrix dimensions                ║
║   matrix stats                   Get matrix statistics                ║
║   matrix view [x] [y]            Visualize matrix area                ║
║   matrix block <x> <y>           Get block at coordinate              ║
║   matrix neighbors <x> <y>       Show 8 neighboring blocks            ║
║   matrix path <x1> <y1> <x2> <y2>  Find path between blocks           ║
╠══════════════════════════════════════════════════════════════════════╣
║ STARGATE (Multi-Chain Hub):                                           ║
║   stargate status                Hub status & statistics              ║
║   stargate start                 Start Stargate EVM bridge            ║
║   stargate connect               MetaMask connection details          ║
║   stargate chains                List connected chains                ║
║   stargate bridge <from> <to> <amt> <token>  Bridge tokens            ║
╠══════════════════════════════════════════════════════════════════════╣
║ OCTAVIA (Nebula Core UI):                                             ║
║   octavia start                  Start Octavia backend                ║
║   octavia setup                  Setup Octavia for ChaosStar          ║
║   octavia config                 Show configuration                   ║
║   octavia status                 Check backend status                 ║
╠══════════════════════════════════════════════════════════════════════╣
║ SEND ASSETS:                                                          ║
║   send <amount> <token> to <address>   Quick token send               ║
║   send token <amt> <type> <to>         Send tokens                    ║
║   send plot <x,y> <to>                 Transfer plot ownership        ║
║   send npc <id> <to>                   Transfer NPC                   ║
║   send planet <id> <to>                Transfer planet                ║
║   send all <to>                        Transfer all assets            ║
╠══════════════════════════════════════════════════════════════════════╣
║ SHORTCUTS:                                                            ║
║   balance          Show your balances                                 ║
║   accounts         List all accounts                                  ║
║   info             Chain info                                         ║
║   logs             Show recent logs                                   ║
║   back, b          Go back                                            ║
╚══════════════════════════════════════════════════════════════════════╝`)
}

func showStatus() {
	cfg := GetConfig()
	client := GetRPCClient()
	
	fmt.Println("\n┌─────────────────────────────────────────────────────────┐")
	fmt.Println("│                    ChaosStar Status                      │")
	fmt.Println("├─────────────────────────────────────────────────────────┤")
	
	// Connection status
	success, err := client.Ping()
	if err != nil || !success {
		fmt.Println("│  🔴 Chain:      DISCONNECTED                            │")
	} else {
		fmt.Println("│  🟢 Chain:      CONNECTED                               │")
	}
	
	// Endpoint
	endpoint := cfg.RPCEndpoint
	if len(endpoint) > 45 {
		endpoint = endpoint[:42] + "..."
	}
	fmt.Printf("│  📡 Endpoint:   %-42s│\n", endpoint)
	
	// Default key
	if cfg.DefaultKey != "" {
		keyInfo, err := LoadKey(cfg.DefaultKey)
		if err == nil {
			fmt.Printf("│  🔑 Key:        %-42s│\n", cfg.DefaultKey)
			addr := keyInfo.Address
			if len(addr) > 42 {
				addr = addr[:20] + "..." + addr[len(addr)-10:]
			}
			fmt.Printf("│  📍 Address:    %-42s│\n", addr)
		}
	} else {
		fmt.Println("│  🔑 Key:        (none set)                              │")
	}
	
	// Block info
	if success {
		block, err := client.GetLastAccepted()
		if err == nil {
			fmt.Printf("│  📦 Height:     %-42d│\n", block.Height)
		}
	}
	
	fmt.Println("└─────────────────────────────────────────────────────────┘")
}

func showQuickStatus() {
	store, err := LoadAccounts()
	if err != nil {
		return
	}
	
	mainAccount := store.GetDefaultAccount()
	if mainAccount == nil {
		fmt.Println("\n  💡 Tip: Create an account with 'account create <name>'")
		return
	}
	
	client := GetRPCClient()
	
	fmt.Println()
	fmt.Printf("  👤 Account: %s\n", mainAccount.Name)
	fmt.Printf("  📍 Address: %s\n", mainAccount.Address[:20]+"..."+mainAccount.Address[len(mainAccount.Address)-8:])
	
	// Get balances
	xbgl, _ := client.GetBalance(mainAccount.Address, 0)
	chaos, _ := client.GetBalance(mainAccount.Address, 1)
	xen, _ := client.GetBalance(mainAccount.Address, 2)
	
	fmt.Printf("  💰 Balances: %s xBGL | %s CHAOS | %s XEN\n", 
		FormatBalance(xbgl, 9),
		FormatBalance(chaos, 9),
		FormatBalance(xen, 9))
	
	fmt.Println()
	fmt.Println("  Quick commands: send, balance, account, help")
}

func parseArgs(input string) []string {
	var args []string
	var current strings.Builder
	inQuote := false
	quoteChar := rune(0)
	
	for _, r := range input {
		switch {
		case r == '"' || r == '\'':
			if inQuote && r == quoteChar {
				inQuote = false
				quoteChar = 0
			} else if !inQuote {
				inQuote = true
				quoteChar = r
			} else {
				current.WriteRune(r)
			}
		case r == ' ' && !inQuote:
			if current.Len() > 0 {
				args = append(args, current.String())
				current.Reset()
			}
		default:
			current.WriteRune(r)
		}
	}
	
	if current.Len() > 0 {
		args = append(args, current.String())
	}
	
	return args
}

func executeShellCommand(args []string) {
	// Handle shortcuts
	switch args[0] {
	case "balance":
		args = append([]string{"chain", "balance"}, args[1:]...)
	case "swap":
		if len(args) > 1 && args[1] != "help" && args[1] != "--help" {
			args = append([]string{"action", "swap"}, args[1:]...)
		}
	case "info":
		args = append([]string{"chain", "info"}, args[1:]...)
	// "send" is now its own command - no mapping needed
	case "ping":
		args = append([]string{"chain", "ping"}, args[1:]...)
	}
	
	// Execute using GetRootCmd to avoid init cycle
	cmd := GetRootCmd()
	cmd.SetArgs(args)
	
	// Capture output
	if err := cmd.Execute(); err != nil {
		// Error already printed by cobra
	}
}

