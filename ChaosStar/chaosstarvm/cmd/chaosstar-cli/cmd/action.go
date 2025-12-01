// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Action commands for submitting transactions

package cmd

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/spf13/cobra"
)

var (
	keyFlag   string
	memoFlag  string
	asyncFlag bool
)

func init() {
	// Add common flags to action command
	actionCmd.PersistentFlags().StringVarP(&keyFlag, "key", "k", "", "Key name to sign with (defaults to config default)")
	actionCmd.PersistentFlags().StringVarP(&memoFlag, "memo", "m", "", "Transaction memo")
	actionCmd.PersistentFlags().BoolVarP(&asyncFlag, "async", "a", false, "Don't wait for confirmation")

	// action transfer
	actionCmd.AddCommand(&cobra.Command{
		Use:   "transfer [to] [amount] [token]",
		Short: "Transfer tokens to an address",
		Long: `Transfer tokens to an address.
Token can be: xBGL, CHAOS, or XEN
Amount is in full units (e.g., 10.5)`,
		Args: cobra.ExactArgs(3),
		Run: func(cmd *cobra.Command, args []string) {
			to := args[0]
			amountStr := args[1]
			tokenStr := args[2]

			// Parse token type
			tokenType, err := ParseTokenType(tokenStr)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			// Parse amount (convert to smallest unit)
			amount, err := ParseAmount(amountStr, 9)
			if err != nil {
				fmt.Printf("Error: Invalid amount: %v\n", err)
				return
			}

			// Get signing key
			privKey, keyInfo, err := getSigningKey()
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			fmt.Println("Transfer Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  From:   %s\n", keyInfo.Address)
			fmt.Printf("  To:     %s\n", to)
			fmt.Printf("  Amount: %s %s\n", amountStr, TokenNames[tokenType])
			if memoFlag != "" {
				fmt.Printf("  Memo:   %s\n", memoFlag)
			}
			fmt.Println()

			// Build and submit transaction
			// In a real implementation, this would:
			// 1. Build the Transfer action
			// 2. Create a transaction with the action
			// 3. Sign with the private key
			// 4. Submit via RPC

			fmt.Printf("Signing with key: %s...\n", keyInfo.Name)
			_ = privKey // Will be used for signing
			_ = amount  // Will be used in transaction

			fmt.Println("⚠️  Transaction building not yet implemented")
			fmt.Println("   This will be connected to the HyperSDK transaction builder")
		},
	})

	// action buy-plot
	actionCmd.AddCommand(&cobra.Command{
		Use:   "buy-plot [x] [y]",
		Short: "Purchase a plot at coordinates",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			x, err := strconv.ParseUint(args[0], 10, 32)
			if err != nil {
				fmt.Printf("Error: Invalid X coordinate: %v\n", err)
				return
			}
			y, err := strconv.ParseUint(args[1], 10, 32)
			if err != nil {
				fmt.Printf("Error: Invalid Y coordinate: %v\n", err)
				return
			}

			_, keyInfo, err := getSigningKey()
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			fmt.Println("Plot Purchase Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Buyer:    %s\n", keyInfo.Address)
			fmt.Printf("  Location: (%d, %d)\n", x, y)
			fmt.Println()
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action upgrade-plot
	actionCmd.AddCommand(&cobra.Command{
		Use:   "upgrade-plot [x] [y]",
		Short: "Upgrade a plot at coordinates",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			x, _ := strconv.ParseUint(args[0], 10, 32)
			y, _ := strconv.ParseUint(args[1], 10, 32)

			fmt.Printf("Upgrading plot at (%d, %d)...\n", x, y)
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action create-npc
	actionCmd.AddCommand(&cobra.Command{
		Use:   "create-npc [name] [x] [y]",
		Short: "Create an NPC at a location",
		Args:  cobra.ExactArgs(3),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			x, _ := strconv.ParseUint(args[1], 10, 32)
			y, _ := strconv.ParseUint(args[2], 10, 32)

			fmt.Println("Create NPC Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Name:     %s\n", name)
			fmt.Printf("  Location: (%d, %d)\n", x, y)
			fmt.Println()
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action train-npc
	actionCmd.AddCommand(&cobra.Command{
		Use:   "train-npc [npc-id] [skill]",
		Short: "Train an NPC in a skill",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			npcID := args[0]
			skill := args[1]

			fmt.Printf("Training NPC %s in %s...\n", npcID, skill)
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action create-city
	actionCmd.AddCommand(&cobra.Command{
		Use:   "create-city [name] [x] [y]",
		Short: "Create a city at a location",
		Args:  cobra.ExactArgs(3),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			x, _ := strconv.ParseUint(args[1], 10, 32)
			y, _ := strconv.ParseUint(args[2], 10, 32)

			fmt.Println("Create City Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Name:     %s\n", name)
			fmt.Printf("  Location: (%d, %d)\n", x, y)
			fmt.Println()
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action create-star-system
	actionCmd.AddCommand(&cobra.Command{
		Use:   "create-star-system [name]",
		Short: "Create a star system (subnet)",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]

			fmt.Println("Create Star System Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Name: %s\n", name)
			fmt.Println()
			fmt.Println("Note: This will create a new subnet on the Avalanche network")
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action create-planet
	actionCmd.AddCommand(&cobra.Command{
		Use:   "create-planet [name] [star-system-id]",
		Short: "Create a planet (validator) in a star system",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			systemID := args[1]

			fmt.Println("Create Planet Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Name:        %s\n", name)
			fmt.Printf("  Star System: %s\n", systemID)
			fmt.Println()
			fmt.Println("Note: This will register a new validator for the subnet")
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action swap
	actionCmd.AddCommand(&cobra.Command{
		Use:   "swap [token-in] [token-out] [amount]",
		Short: "Swap tokens via treasury",
		Long: `Swap tokens through the treasury liquidity pool.
Example: chaosstar-cli action swap xBGL CHAOS 100`,
		Args: cobra.ExactArgs(3),
		Run: func(cmd *cobra.Command, args []string) {
			tokenInStr := args[0]
			tokenOutStr := args[1]
			amountStr := args[2]

			tokenIn, err := ParseTokenType(tokenInStr)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			tokenOut, err := ParseTokenType(tokenOutStr)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			if tokenIn == tokenOut {
				fmt.Println("Error: Cannot swap same token type")
				return
			}

			amount, err := ParseAmount(amountStr, 9)
			if err != nil {
				fmt.Printf("Error: Invalid amount: %v\n", err)
				return
			}

			_, keyInfo, err := getSigningKey()
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			fmt.Println("Token Swap Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Account:   %s\n", keyInfo.Address)
			fmt.Printf("  Swap:      %s %s -> %s\n", amountStr, TokenNames[tokenIn], TokenNames[tokenOut])
			fmt.Println()
			_ = amount
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})

	// action register-validator
	actionCmd.AddCommand(&cobra.Command{
		Use:   "register-validator [name] [stake-amount]",
		Short: "Register as a validator",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			stakeStr := args[1]

			stake, err := ParseAmount(stakeStr, 9)
			if err != nil {
				fmt.Printf("Error: Invalid stake amount: %v\n", err)
				return
			}

			fmt.Println("Register Validator Transaction")
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Name:  %s\n", name)
			fmt.Printf("  Stake: %s xBGL\n", stakeStr)
			fmt.Println()
			_ = stake
			fmt.Println("⚠️  Transaction building not yet implemented")
		},
	})
}

// getSigningKey gets the private key for signing
func getSigningKey() ([]byte, *KeyInfo, error) {
	keyName := keyFlag
	if keyName == "" {
		cfg := GetConfig()
		keyName = cfg.DefaultKey
	}

	if keyName == "" {
		return nil, nil, fmt.Errorf("no key specified. Use --key flag or set a default key")
	}

	keyInfo, err := LoadKey(keyName)
	if err != nil {
		return nil, nil, fmt.Errorf("key '%s' not found", keyName)
	}

	privKeyBytes, err := hex.DecodeString(keyInfo.PrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid private key")
	}

	return privKeyBytes, keyInfo, nil
}

// ParseAmount parses an amount string to smallest unit
func ParseAmount(amountStr string, decimals int) (uint64, error) {
	// Split by decimal point
	parts := strings.Split(amountStr, ".")

	var whole, frac uint64
	var err error

	// Parse whole part
	if parts[0] != "" {
		whole, err = strconv.ParseUint(parts[0], 10, 64)
		if err != nil {
			return 0, err
		}
	}

	// Parse fractional part
	if len(parts) > 1 && parts[1] != "" {
		fracStr := parts[1]
		// Pad or truncate to decimals
		if len(fracStr) > decimals {
			fracStr = fracStr[:decimals]
		} else {
			fracStr = fracStr + strings.Repeat("0", decimals-len(fracStr))
		}
		frac, err = strconv.ParseUint(fracStr, 10, 64)
		if err != nil {
			return 0, err
		}
	}

	// Calculate total
	multiplier := uint64(1)
	for i := 0; i < decimals; i++ {
		multiplier *= 10
	}

	return whole*multiplier + frac, nil
}

// ParseAddress parses an address string to bytes
func ParseAddress(addrStr string) (codec.Address, error) {
	// Remove 0x prefix if present
	addrStr = strings.TrimPrefix(addrStr, "0x")
	
	addrBytes, err := hex.DecodeString(addrStr)
	if err != nil {
		return codec.Address{}, err
	}
	
	var addr codec.Address
	copy(addr[:], addrBytes)
	return addr, nil
}

