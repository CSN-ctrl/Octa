// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Key management commands

package cmd

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/spf13/cobra"
)

// KeyInfo stores key information
type KeyInfo struct {
	Name       string `json:"name"`
	PublicKey  string `json:"publicKey"`
	Address    string `json:"address"`
	PrivateKey string `json:"privateKey,omitempty"`
}

// GetKeysDir returns the keys directory path
func GetKeysDir() string {
	return filepath.Join(GetConfigDir(), "keys")
}

// GenerateKey generates a new ED25519 keypair
func GenerateKey() (ed25519.PrivateKey, ed25519.PublicKey, error) {
	privKey, err := ed25519.GeneratePrivateKey()
	if err != nil {
		return ed25519.EmptyPrivateKey, ed25519.EmptyPublicKey, err
	}
	return privKey, privKey.PublicKey(), nil
}

// PublicKeyToAddress converts a public key to an address
func PublicKeyToAddress(pubKey ed25519.PublicKey) codec.Address {
	// Create an ids.ID from the public key bytes
	id := ids.ID(pubKey)
	return codec.CreateAddress(0, id)
}

// SaveKey saves a key to the keys directory
func SaveKey(name string, privKey ed25519.PrivateKey) error {
	keysDir := GetKeysDir()
	if err := os.MkdirAll(keysDir, 0700); err != nil {
		return err
	}

	pubKey := privKey.PublicKey()
	addr := PublicKeyToAddress(pubKey)

	keyInfo := KeyInfo{
		Name:       name,
		PublicKey:  hex.EncodeToString(pubKey[:]),
		Address:    addr.String(),
		PrivateKey: hex.EncodeToString(privKey[:]),
	}

	data, err := json.MarshalIndent(keyInfo, "", "  ")
	if err != nil {
		return err
	}

	keyPath := filepath.Join(keysDir, name+".json")
	return os.WriteFile(keyPath, data, 0600)
}

// LoadKey loads a key from the keys directory
func LoadKey(name string) (*KeyInfo, error) {
	keyPath := filepath.Join(GetKeysDir(), name+".json")
	data, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}

	var keyInfo KeyInfo
	if err := json.Unmarshal(data, &keyInfo); err != nil {
		return nil, err
	}

	return &keyInfo, nil
}

// LoadPrivateKey loads and returns the private key
func LoadPrivateKey(name string) (ed25519.PrivateKey, error) {
	keyInfo, err := LoadKey(name)
	if err != nil {
		return ed25519.EmptyPrivateKey, err
	}

	privKeyBytes, err := hex.DecodeString(keyInfo.PrivateKey)
	if err != nil {
		return ed25519.EmptyPrivateKey, err
	}

	return ed25519.PrivateKey(privKeyBytes), nil
}

// ListKeys lists all keys in the keys directory
func ListKeys() ([]KeyInfo, error) {
	keysDir := GetKeysDir()
	
	// Create keys directory if it doesn't exist
	if err := os.MkdirAll(keysDir, 0700); err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(keysDir)
	if err != nil {
		return nil, err
	}

	var keys []KeyInfo
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		name := strings.TrimSuffix(entry.Name(), ".json")
		keyInfo, err := LoadKey(name)
		if err != nil {
			continue
		}

		// Don't include private key in list
		keyInfo.PrivateKey = ""
		keys = append(keys, *keyInfo)
	}

	return keys, nil
}

func init() {
	// key generate
	keyCmd.AddCommand(&cobra.Command{
		Use:   "generate [name]",
		Short: "Generate a new key pair",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]

			// Check if key already exists
			if _, err := LoadKey(name); err == nil {
				fmt.Printf("Error: Key '%s' already exists\n", name)
				return
			}

			privKey, pubKey, err := GenerateKey()
			if err != nil {
				fmt.Printf("Error generating key: %v\n", err)
				return
			}

			if err := SaveKey(name, privKey); err != nil {
				fmt.Printf("Error saving key: %v\n", err)
				return
			}

			addr := PublicKeyToAddress(pubKey)
			fmt.Println("✓ Key generated successfully!")
			fmt.Println()
			fmt.Printf("  Name:       %s\n", name)
			fmt.Printf("  Public Key: %s\n", hex.EncodeToString(pubKey[:]))
			fmt.Printf("  Address:    %s\n", addr.String())
			fmt.Println()
			fmt.Println("⚠️  IMPORTANT: Backup your key file at:")
			fmt.Printf("    %s\n", filepath.Join(GetKeysDir(), name+".json"))
		},
	})

	// key import
	keyCmd.AddCommand(&cobra.Command{
		Use:   "import [name] [private-key-hex]",
		Short: "Import an existing private key",
		Args:  cobra.ExactArgs(2),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			privKeyHex := args[1]

			// Remove 0x prefix if present
			privKeyHex = strings.TrimPrefix(privKeyHex, "0x")

			// Decode private key
			privKeyBytes, err := hex.DecodeString(privKeyHex)
			if err != nil {
				fmt.Printf("Error: Invalid private key format: %v\n", err)
				return
			}

			if len(privKeyBytes) != ed25519.PrivateKeyLen {
				fmt.Printf("Error: Invalid private key length (expected %d bytes, got %d)\n", ed25519.PrivateKeyLen, len(privKeyBytes))
				return
			}

			privKey := ed25519.PrivateKey(privKeyBytes)
			pubKey := privKey.PublicKey()

			if err := SaveKey(name, privKey); err != nil {
				fmt.Printf("Error saving key: %v\n", err)
				return
			}

			addr := PublicKeyToAddress(pubKey)
			fmt.Println("✓ Key imported successfully!")
			fmt.Println()
			fmt.Printf("  Name:       %s\n", name)
			fmt.Printf("  Public Key: %s\n", hex.EncodeToString(pubKey[:]))
			fmt.Printf("  Address:    %s\n", addr.String())
		},
	})

	// key list
	keyCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List all keys",
		Run: func(cmd *cobra.Command, args []string) {
			keys, err := ListKeys()
			if err != nil {
				fmt.Printf("Error listing keys: %v\n", err)
				return
			}

			if len(keys) == 0 {
				fmt.Println("No keys found. Use 'chaosstar-cli key generate <name>' to create one.")
				return
			}

			fmt.Println("Keys:")
			fmt.Println(strings.Repeat("-", 80))
			for _, key := range keys {
				cfg := GetConfig()
				defaultMarker := ""
				if cfg.DefaultKey == key.Name {
					defaultMarker = " (default)"
				}
				fmt.Printf("  %s%s\n", key.Name, defaultMarker)
				fmt.Printf("    Address: %s\n", key.Address)
				fmt.Println()
			}
		},
	})

	// key show
	keyCmd.AddCommand(&cobra.Command{
		Use:   "show [name]",
		Short: "Show key details",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]

			keyInfo, err := LoadKey(name)
			if err != nil {
				fmt.Printf("Error: Key '%s' not found\n", name)
				return
			}

			fmt.Printf("Key: %s\n", keyInfo.Name)
			fmt.Println(strings.Repeat("-", 60))
			fmt.Printf("  Public Key: %s\n", keyInfo.PublicKey)
			fmt.Printf("  Address:    %s\n", keyInfo.Address)
		},
	})

	// key export
	keyCmd.AddCommand(&cobra.Command{
		Use:   "export [name]",
		Short: "Export private key (DANGEROUS)",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]

			keyInfo, err := LoadKey(name)
			if err != nil {
				fmt.Printf("Error: Key '%s' not found\n", name)
				return
			}

			fmt.Println("⚠️  WARNING: Never share your private key!")
			fmt.Println()
			fmt.Printf("Private Key: %s\n", keyInfo.PrivateKey)
		},
	})

	// key delete
	keyCmd.AddCommand(&cobra.Command{
		Use:   "delete [name]",
		Short: "Delete a key",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			name := args[0]
			keyPath := filepath.Join(GetKeysDir(), name+".json")

			if _, err := os.Stat(keyPath); os.IsNotExist(err) {
				fmt.Printf("Error: Key '%s' not found\n", name)
				return
			}

			if err := os.Remove(keyPath); err != nil {
				fmt.Printf("Error deleting key: %v\n", err)
				return
			}

			fmt.Printf("✓ Key '%s' deleted\n", name)

			// Clear default if this was the default key
			cfg := GetConfig()
			if cfg.DefaultKey == name {
				cfg.DefaultKey = ""
				SaveConfig(cfg)
			}
		},
	})

	// key random - generate random bytes (for testing)
	keyCmd.AddCommand(&cobra.Command{
		Use:   "random [bytes]",
		Short: "Generate random hex bytes",
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			n := 32
			if len(args) > 0 {
				fmt.Sscanf(args[0], "%d", &n)
			}

			bytes := make([]byte, n)
			rand.Read(bytes)
			fmt.Println(hex.EncodeToString(bytes))
		},
	})
}

