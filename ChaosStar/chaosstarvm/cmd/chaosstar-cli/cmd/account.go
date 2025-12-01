// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Account management commands

package cmd

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/spf13/cobra"
)

// Account represents a user account
type Account struct {
	Name       string    `json:"name"`
	Address    string    `json:"address"`
	PublicKey  string    `json:"publicKey"`
	PrivateKey string    `json:"privateKey,omitempty"`
	KeyFile    string    `json:"keyFile,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	LastUsed   time.Time `json:"lastUsed,omitempty"`
	Tags       []string  `json:"tags,omitempty"`
	Notes      string    `json:"notes,omitempty"`
	IsDefault  bool      `json:"isDefault,omitempty"`
	IsWatchOnly bool     `json:"isWatchOnly,omitempty"`
}

// AccountStore manages multiple accounts
type AccountStore struct {
	Accounts       []Account `json:"accounts"`
	DefaultAccount string    `json:"defaultAccount"`
	Version        int       `json:"version"`
}

// GetAccountsFile returns the accounts file path
func GetAccountsFile() string {
	return filepath.Join(GetConfigDir(), "accounts.json")
}

// LoadAccounts loads accounts from file
func LoadAccounts() (*AccountStore, error) {
	path := GetAccountsFile()
	
	// Create default store if file doesn't exist
	if _, err := os.Stat(path); os.IsNotExist(err) {
		store := &AccountStore{
			Accounts: []Account{},
			Version:  1,
		}
		return store, SaveAccounts(store)
	}
	
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	
	var store AccountStore
	if err := json.Unmarshal(data, &store); err != nil {
		return nil, err
	}
	
	return &store, nil
}

// SaveAccounts saves accounts to file
func SaveAccounts(store *AccountStore) error {
	path := GetAccountsFile()
	
	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	
	return os.WriteFile(path, data, 0600)
}

// GetAccount returns an account by name or address
func (s *AccountStore) GetAccount(nameOrAddr string) *Account {
	for i := range s.Accounts {
		if s.Accounts[i].Name == nameOrAddr || s.Accounts[i].Address == nameOrAddr {
			return &s.Accounts[i]
		}
	}
	return nil
}

// GetDefaultAccount returns the default account
func (s *AccountStore) GetDefaultAccount() *Account {
	if s.DefaultAccount == "" && len(s.Accounts) > 0 {
		return &s.Accounts[0]
	}
	return s.GetAccount(s.DefaultAccount)
}

// AddAccount adds a new account
func (s *AccountStore) AddAccount(acc Account) error {
	// Check for duplicates
	for _, existing := range s.Accounts {
		if existing.Name == acc.Name {
			return fmt.Errorf("account with name '%s' already exists", acc.Name)
		}
		if existing.Address == acc.Address {
			return fmt.Errorf("account with address '%s' already exists", acc.Address)
		}
	}
	
	s.Accounts = append(s.Accounts, acc)
	
	// Set as default if first account
	if len(s.Accounts) == 1 {
		s.DefaultAccount = acc.Name
	}
	
	return nil
}

// RemoveAccount removes an account
func (s *AccountStore) RemoveAccount(nameOrAddr string) error {
	for i, acc := range s.Accounts {
		if acc.Name == nameOrAddr || acc.Address == nameOrAddr {
			s.Accounts = append(s.Accounts[:i], s.Accounts[i+1:]...)
			
			// Update default if needed
			if s.DefaultAccount == acc.Name {
				if len(s.Accounts) > 0 {
					s.DefaultAccount = s.Accounts[0].Name
				} else {
					s.DefaultAccount = ""
				}
			}
			return nil
		}
	}
	return fmt.Errorf("account not found: %s", nameOrAddr)
}

// accountCmd is the parent command for account operations
var accountCmd = &cobra.Command{
	Use:   "account",
	Short: "Account management",
	Long: `Manage multiple accounts for ChaosStar.

Accounts can be created, imported, listed, and switched between.
Each account has a unique name and address.`,
	Aliases: []string{"acc", "accounts"},
}

func init() {
	rootCmd.AddCommand(accountCmd)
	
	// account list
	accountCmd.AddCommand(&cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List all accounts",
		Run:     runAccountList,
	})
	
	// account create
	createCmd := &cobra.Command{
		Use:   "create [name]",
		Short: "Create a new account",
		Args:  cobra.ExactArgs(1),
		Run:   runAccountCreate,
	}
	createCmd.Flags().StringP("tags", "t", "", "Comma-separated tags")
	createCmd.Flags().StringP("notes", "n", "", "Account notes")
	accountCmd.AddCommand(createCmd)
	
	// account import
	importCmd := &cobra.Command{
		Use:   "import [name] [private-key]",
		Short: "Import an account from private key",
		Args:  cobra.ExactArgs(2),
		Run:   runAccountImport,
	}
	importCmd.Flags().StringP("tags", "t", "", "Comma-separated tags")
	accountCmd.AddCommand(importCmd)
	
	// account import-key (import from existing key file)
	importKeyCmd := &cobra.Command{
		Use:   "import-key [name] [key-name]",
		Short: "Import an account from existing key file",
		Args:  cobra.ExactArgs(2),
		Run:   runAccountImportKey,
	}
	accountCmd.AddCommand(importKeyCmd)
	
	// account watch
	watchAccCmd := &cobra.Command{
		Use:   "watch [name] [address]",
		Short: "Add a watch-only account",
		Args:  cobra.ExactArgs(2),
		Run:   runAccountWatch,
	}
	accountCmd.AddCommand(watchAccCmd)
	
	// account show
	accountCmd.AddCommand(&cobra.Command{
		Use:   "show [name]",
		Short: "Show account details",
		Args:  cobra.MaximumNArgs(1),
		Run:   runAccountShow,
	})
	
	// account use/switch
	accountCmd.AddCommand(&cobra.Command{
		Use:     "use [name]",
		Aliases: []string{"switch", "set"},
		Short:   "Set default account",
		Args:    cobra.ExactArgs(1),
		Run:     runAccountUse,
	})
	
	// account rename
	accountCmd.AddCommand(&cobra.Command{
		Use:   "rename [old-name] [new-name]",
		Short: "Rename an account",
		Args:  cobra.ExactArgs(2),
		Run:   runAccountRename,
	})
	
	// account remove
	accountCmd.AddCommand(&cobra.Command{
		Use:     "remove [name]",
		Aliases: []string{"rm", "delete"},
		Short:   "Remove an account",
		Args:    cobra.ExactArgs(1),
		Run:     runAccountRemove,
	})
	
	// account balance (show balances for all accounts)
	accountCmd.AddCommand(&cobra.Command{
		Use:     "balances",
		Aliases: []string{"bal"},
		Short:   "Show balances for all accounts",
		Run:     runAccountBalances,
	})
	
	// account export
	accountCmd.AddCommand(&cobra.Command{
		Use:   "export [name]",
		Short: "Export account private key",
		Args:  cobra.ExactArgs(1),
		Run:   runAccountExport,
	})
	
	// account tag
	tagCmd := &cobra.Command{
		Use:   "tag [name] [tags...]",
		Short: "Add tags to an account",
		Args:  cobra.MinimumNArgs(2),
		Run:   runAccountTag,
	}
	accountCmd.AddCommand(tagCmd)
}

func runAccountList(cmd *cobra.Command, args []string) {
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if len(store.Accounts) == 0 {
		fmt.Println("No accounts found.")
		fmt.Println("\nCreate one with: chaosstar account create <name>")
		return
	}
	
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                           Accounts                                    ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	
	for _, acc := range store.Accounts {
		defaultMark := "  "
		if acc.Name == store.DefaultAccount {
			defaultMark = "→ "
		}
		
		watchMark := ""
		if acc.IsWatchOnly {
			watchMark = " 👁"
		}
		
		addr := acc.Address
		if len(addr) > 20 {
			addr = addr[:10] + "..." + addr[len(addr)-8:]
		}
		
		fmt.Printf("║ %s%-12s %s%s\n", defaultMark, acc.Name, addr, watchMark)
		
		if len(acc.Tags) > 0 {
			fmt.Printf("║    Tags: %s\n", strings.Join(acc.Tags, ", "))
		}
	}
	
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
	fmt.Printf("\nTotal: %d account(s)\n", len(store.Accounts))
}

func runAccountCreate(cmd *cobra.Command, args []string) {
	name := args[0]
	tags, _ := cmd.Flags().GetString("tags")
	notes, _ := cmd.Flags().GetString("notes")
	
	// Generate new key
	privKey, err := ed25519.GeneratePrivateKey()
	if err != nil {
		fmt.Printf("Error generating key: %v\n", err)
		return
	}
	
	pubKey := privKey.PublicKey()
	id := ids.ID(pubKey)
	addr := codec.CreateAddress(0, id)
	
	// Create account
	acc := Account{
		Name:       name,
		Address:    addr.String(),
		PublicKey:  hex.EncodeToString(pubKey[:]),
		PrivateKey: hex.EncodeToString(privKey[:]),
		CreatedAt:  time.Now(),
	}
	
	if tags != "" {
		acc.Tags = strings.Split(tags, ",")
	}
	acc.Notes = notes
	
	// Save to store
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if err := store.AddAccount(acc); err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Println("✓ Account created successfully!")
	fmt.Println()
	fmt.Printf("  Name:    %s\n", acc.Name)
	fmt.Printf("  Address: %s\n", acc.Address)
	fmt.Println()
	fmt.Println("⚠️  IMPORTANT: Backup your private key!")
	fmt.Printf("  Run: chaosstar account export %s\n", name)
}

func runAccountImport(cmd *cobra.Command, args []string) {
	name := args[0]
	privKeyHex := strings.TrimPrefix(args[1], "0x")
	tags, _ := cmd.Flags().GetString("tags")
	
	// Decode private key
	privKeyBytes, err := hex.DecodeString(privKeyHex)
	if err != nil {
		fmt.Printf("Error: Invalid private key format\n")
		return
	}
	
	if len(privKeyBytes) != ed25519.PrivateKeyLen {
		fmt.Printf("Error: Invalid private key length\n")
		return
	}
	
	privKey := ed25519.PrivateKey(privKeyBytes)
	pubKey := privKey.PublicKey()
	id := ids.ID(pubKey)
	addr := codec.CreateAddress(0, id)
	
	// Create account
	acc := Account{
		Name:       name,
		Address:    addr.String(),
		PublicKey:  hex.EncodeToString(pubKey[:]),
		PrivateKey: hex.EncodeToString(privKey[:]),
		CreatedAt:  time.Now(),
	}
	
	if tags != "" {
		acc.Tags = strings.Split(tags, ",")
	}
	
	// Save to store
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if err := store.AddAccount(acc); err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Println("✓ Account imported successfully!")
	fmt.Printf("  Name:    %s\n", acc.Name)
	fmt.Printf("  Address: %s\n", acc.Address)
}

func runAccountImportKey(cmd *cobra.Command, args []string) {
	name := args[0]
	keyName := args[1]
	
	// Load existing key
	keyInfo, err := LoadKey(keyName)
	if err != nil {
		fmt.Printf("Error: Key '%s' not found\n", keyName)
		return
	}
	
	// Create account from key
	acc := Account{
		Name:       name,
		Address:    keyInfo.Address,
		PublicKey:  keyInfo.PublicKey,
		PrivateKey: keyInfo.PrivateKey,
		KeyFile:    keyName,
		CreatedAt:  time.Now(),
	}
	
	// Save to store
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if err := store.AddAccount(acc); err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Println("✓ Account created from key!")
	fmt.Printf("  Name:    %s\n", acc.Name)
	fmt.Printf("  Address: %s\n", acc.Address)
	fmt.Printf("  Key:     %s\n", keyName)
}

func runAccountWatch(cmd *cobra.Command, args []string) {
	name := args[0]
	address := args[1]
	
	// Create watch-only account
	acc := Account{
		Name:        name,
		Address:     address,
		CreatedAt:   time.Now(),
		IsWatchOnly: true,
	}
	
	// Save to store
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if err := store.AddAccount(acc); err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Println("✓ Watch-only account added!")
	fmt.Printf("  Name:    %s\n", acc.Name)
	fmt.Printf("  Address: %s\n", acc.Address)
	fmt.Println("  Note: This account cannot sign transactions")
}

func runAccountShow(cmd *cobra.Command, args []string) {
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	var acc *Account
	if len(args) > 0 {
		acc = store.GetAccount(args[0])
	} else {
		acc = store.GetDefaultAccount()
	}
	
	if acc == nil {
		fmt.Println("Account not found")
		return
	}
	
	fmt.Println("╔══════════════════════════════════════════════════════════════════════╗")
	fmt.Printf("║  Account: %-60s║\n", acc.Name)
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  Address:    %s\n", acc.Address)
	
	if acc.PublicKey != "" {
		fmt.Printf("║  Public Key: %s...\n", acc.PublicKey[:32])
	}
	
	if acc.IsWatchOnly {
		fmt.Println("║  Type:       Watch-only 👁")
	} else {
		fmt.Println("║  Type:       Full access 🔑")
	}
	
	fmt.Printf("║  Created:    %s\n", acc.CreatedAt.Format("2006-01-02 15:04:05"))
	
	if len(acc.Tags) > 0 {
		fmt.Printf("║  Tags:       %s\n", strings.Join(acc.Tags, ", "))
	}
	
	if acc.Notes != "" {
		fmt.Printf("║  Notes:      %s\n", acc.Notes)
	}
	
	fmt.Println("╠══════════════════════════════════════════════════════════════════════╣")
	
	// Get balances
	client := GetRPCClient()
	fmt.Println("║  Balances:")
	
	for tokenType := uint8(0); tokenType <= 2; tokenType++ {
		balance, err := client.GetBalance(acc.Address, tokenType)
		if err != nil {
			balance = 0
		}
		
		tokenName := "xBGL"
		switch tokenType {
		case 1:
			tokenName = "CHAOS"
		case 2:
			tokenName = "XEN"
		}
		
		fmt.Printf("║    %-8s %s\n", tokenName+":", FormatBalance(balance, 9))
	}
	
	fmt.Println("╚══════════════════════════════════════════════════════════════════════╝")
}

func runAccountUse(cmd *cobra.Command, args []string) {
	name := args[0]
	
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	acc := store.GetAccount(name)
	if acc == nil {
		fmt.Printf("Account not found: %s\n", name)
		return
	}
	
	store.DefaultAccount = acc.Name
	acc.LastUsed = time.Now()
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	// Also update config default key if account has a key
	if acc.PrivateKey != "" || acc.KeyFile != "" {
		cfg := GetConfig()
		if acc.KeyFile != "" {
			cfg.DefaultKey = acc.KeyFile
		}
		SaveConfig(cfg)
	}
	
	fmt.Printf("✓ Switched to account: %s\n", acc.Name)
	fmt.Printf("  Address: %s\n", acc.Address)
}

func runAccountRename(cmd *cobra.Command, args []string) {
	oldName := args[0]
	newName := args[1]
	
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	// Check new name doesn't exist
	if store.GetAccount(newName) != nil {
		fmt.Printf("Error: Account '%s' already exists\n", newName)
		return
	}
	
	// Find and rename
	found := false
	for i := range store.Accounts {
		if store.Accounts[i].Name == oldName {
			store.Accounts[i].Name = newName
			found = true
			
			// Update default if needed
			if store.DefaultAccount == oldName {
				store.DefaultAccount = newName
			}
			break
		}
	}
	
	if !found {
		fmt.Printf("Account not found: %s\n", oldName)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Printf("✓ Renamed '%s' to '%s'\n", oldName, newName)
}

func runAccountRemove(cmd *cobra.Command, args []string) {
	name := args[0]
	
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if err := store.RemoveAccount(name); err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Printf("✓ Account '%s' removed\n", name)
}

func runAccountBalances(cmd *cobra.Command, args []string) {
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	if len(store.Accounts) == 0 {
		fmt.Println("No accounts found.")
		return
	}
	
	client := GetRPCClient()
	
	fmt.Println("╔══════════════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                              Account Balances                                 ║")
	fmt.Println("╠════════════════╦═══════════════════╦═══════════════════╦═══════════════════╣")
	fmt.Println("║ Account        ║ xBGL              ║ CHAOS             ║ XEN               ║")
	fmt.Println("╠════════════════╬═══════════════════╬═══════════════════╬═══════════════════╣")
	
	var totalXBGL, totalChaos, totalXen uint64
	
	for _, acc := range store.Accounts {
		xbgl, _ := client.GetBalance(acc.Address, 0)
		chaos, _ := client.GetBalance(acc.Address, 1)
		xen, _ := client.GetBalance(acc.Address, 2)
		
		totalXBGL += xbgl
		totalChaos += chaos
		totalXen += xen
		
		name := acc.Name
		if len(name) > 14 {
			name = name[:11] + "..."
		}
		
		fmt.Printf("║ %-14s ║ %17s ║ %17s ║ %17s ║\n",
			name,
			FormatBalance(xbgl, 9),
			FormatBalance(chaos, 9),
			FormatBalance(xen, 9),
		)
	}
	
	fmt.Println("╠════════════════╬═══════════════════╬═══════════════════╬═══════════════════╣")
	fmt.Printf("║ %-14s ║ %17s ║ %17s ║ %17s ║\n",
		"TOTAL",
		FormatBalance(totalXBGL, 9),
		FormatBalance(totalChaos, 9),
		FormatBalance(totalXen, 9),
	)
	fmt.Println("╚════════════════╩═══════════════════╩═══════════════════╩═══════════════════╝")
}

func runAccountExport(cmd *cobra.Command, args []string) {
	name := args[0]
	
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	acc := store.GetAccount(name)
	if acc == nil {
		fmt.Printf("Account not found: %s\n", name)
		return
	}
	
	if acc.IsWatchOnly {
		fmt.Println("Error: Cannot export watch-only account")
		return
	}
	
	if acc.PrivateKey == "" {
		fmt.Println("Error: Account has no private key stored")
		return
	}
	
	fmt.Println("⚠️  WARNING: Never share your private key!")
	fmt.Println()
	fmt.Printf("Account:     %s\n", acc.Name)
	fmt.Printf("Address:     %s\n", acc.Address)
	fmt.Printf("Private Key: %s\n", acc.PrivateKey)
}

func runAccountTag(cmd *cobra.Command, args []string) {
	name := args[0]
	newTags := args[1:]
	
	store, err := LoadAccounts()
	if err != nil {
		fmt.Printf("Error loading accounts: %v\n", err)
		return
	}
	
	// Find account
	var acc *Account
	for i := range store.Accounts {
		if store.Accounts[i].Name == name {
			acc = &store.Accounts[i]
			break
		}
	}
	
	if acc == nil {
		fmt.Printf("Account not found: %s\n", name)
		return
	}
	
	// Add tags (avoid duplicates)
	tagSet := make(map[string]bool)
	for _, t := range acc.Tags {
		tagSet[t] = true
	}
	for _, t := range newTags {
		tagSet[t] = true
	}
	
	acc.Tags = make([]string, 0, len(tagSet))
	for t := range tagSet {
		acc.Tags = append(acc.Tags, t)
	}
	
	if err := SaveAccounts(store); err != nil {
		fmt.Printf("Error saving accounts: %v\n", err)
		return
	}
	
	fmt.Printf("✓ Tags updated for '%s': %s\n", name, strings.Join(acc.Tags, ", "))
}

