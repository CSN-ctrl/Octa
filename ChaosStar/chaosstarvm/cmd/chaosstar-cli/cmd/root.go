// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// CLI Root command

package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	Version = "1.0.0"
)

var rootCmd = &cobra.Command{
	Use:   "chaosstar",
	Short: "ChaosStar Network CLI",
	Long: `
   _____ _                      _____ _             
  / ____| |                    / ____| |            
 | |    | |__   __ _  ___  ___| (___ | |_ __ _ _ __ 
 | |    | '_ \ / _' |/ _ \/ __|\___ \| __/ _' | '__|
 | |____| | | | (_| | (_) \__ \____) | || (_| | |   
  \_____|_| |_|\__,_|\___/|___/_____/ \__\__,_|_|   
                                                    
ChaosStar Network Command Line Interface v` + Version + `

A CLI for interacting with the ChaosStar Network blockchain.
Manage keys, query balances, and submit transactions for:
  - Token transfers (xBGL, CHAOS, XEN)
  - Plot management
  - NPC operations
  - Star systems (subnets)
  - Planets (validators)
  - Cities
  - Treasury swaps

Get started:
  chaosstar                          # Start interactive shell
  chaosstar key generate mykey       # Create a new key
  chaosstar config set-key mykey     # Set as default
  chaosstar chain info               # View chain info
  chaosstar chain balance            # Check your balance
`,
}

// Execute runs the root command
func Execute() error {
	return rootCmd.Execute()
}

// GetRootCmd returns a copy of the root command for shell execution
func GetRootCmd() *cobra.Command {
	// Create a fresh root command to avoid state issues
	newCmd := *rootCmd
	newCmd.Run = nil // Don't trigger shell again
	return &newCmd
}

// SetupShellMode sets up the shell as default when no args
func SetupShellMode() {
	rootCmd.Run = func(cmd *cobra.Command, args []string) {
		StartShell()
	}
}

// keyCmd handles key management
var keyCmd = &cobra.Command{
	Use:   "key",
	Short: "Key management commands",
	Long: `Key management commands for generating, importing, and managing ED25519 keys.

Keys are stored in ~/.chaosstar/keys/ directory.
Each key file contains the public key, address, and encrypted private key.`,
}

// chainCmd handles chain operations
var chainCmd = &cobra.Command{
	Use:   "chain",
	Short: "Chain interaction commands",
	Long: `Commands for querying chain state and information.

Examples:
  chaosstar-cli chain ping              # Check if chain is online
  chaosstar-cli chain info              # Get chain information
  chaosstar-cli chain balance <address> # Get balance for an address
  chaosstar-cli chain tx <txid>         # Get transaction status`,
}

// actionCmd handles action creation
var actionCmd = &cobra.Command{
	Use:   "action",
	Short: "Submit transactions",
	Long: `Commands for creating and submitting transactions to the chain.

All actions require a signing key (use --key flag or set default key).

Available actions:
  transfer           Transfer tokens
  buy-plot           Purchase a plot
  upgrade-plot       Upgrade a plot
  create-npc         Create an NPC
  train-npc          Train an NPC
  create-city        Create a city
  create-star-system Create a star system (subnet)
  create-planet      Create a planet (validator)
  swap               Swap tokens via treasury
  register-validator Register as validator`,
}

// genesisCmd handles genesis file operations
var genesisCmd = &cobra.Command{
	Use:   "genesis",
	Short: "Genesis file commands",
	Long:  "Generate and validate genesis files for new chains",
}

func init() {
	// Load config on startup
	LoadConfig()

	// Add commands
	rootCmd.AddCommand(keyCmd)
	rootCmd.AddCommand(chainCmd)
	rootCmd.AddCommand(actionCmd)
	rootCmd.AddCommand(genesisCmd)

	// Version command
	rootCmd.AddCommand(&cobra.Command{
		Use:   "version",
		Short: "Print version information",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("ChaosStar CLI v%s\n", Version)
		},
	})

	// Genesis subcommands
	genesisCmd.AddCommand(&cobra.Command{
		Use:   "generate [output-file]",
		Short: "Generate a genesis file",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			generateGenesis(args[0])
		},
	})
}

func generateGenesis(outputFile string) {
	genesis := `{
  "stateBranchFactor": 16,
  "customAllocation": [],
  "initialRules": {
    "minBlockGap": 100,
    "minEmptyBlockGap": 750,
    "minUnitPrice": {
      "bandwidth": 100,
      "compute": 100,
      "storageRead": 100,
      "storageAllocate": 100,
      "storageWrite": 100
    },
    "unitPriceChangeDenominator": {
      "bandwidth": 48,
      "compute": 48,
      "storageRead": 48,
      "storageAllocate": 48,
      "storageWrite": 48
    },
    "windowTargetUnits": {
      "bandwidth": 20000000,
      "compute": 1000,
      "storageRead": 1000,
      "storageAllocate": 1000,
      "storageWrite": 1000
    },
    "maxBlockUnits": {
      "bandwidth": 1800000,
      "compute": 2000,
      "storageRead": 2000,
      "storageAllocate": 2000,
      "storageWrite": 2000
    },
    "validityWindow": 60000,
    "maxActionsPerTx": 16,
    "maxOutputsPerAction": 1,
    "baseUnits": 1,
    "storageKeyReadUnits": 5,
    "storageValueReadUnits": 2,
    "storageKeyAllocateUnits": 20,
    "storageValueAllocateUnits": 5,
    "storageKeyWriteUnits": 10,
    "storageValueWriteUnits": 3,
    "sponsorStateKeysMaxChunks": [1]
  }
}`
	err := os.WriteFile(outputFile, []byte(genesis), 0644)
	if err != nil {
		fmt.Printf("Error writing genesis file: %v\n", err)
		return
	}
	fmt.Printf("✓ Genesis file written to %s\n", outputFile)
}
