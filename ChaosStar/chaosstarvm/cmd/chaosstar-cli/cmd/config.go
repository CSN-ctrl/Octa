// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// CLI Configuration

package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

// Config holds CLI configuration
type Config struct {
	DefaultKey     string `json:"defaultKey"`
	RPCEndpoint    string `json:"rpcEndpoint"`
	ChainID        string `json:"chainId"`
	NetworkTimeout int    `json:"networkTimeout"`
}

var (
	configPath string
	config     *Config
)

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		DefaultKey:     "",
		RPCEndpoint:    "http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi",
		ChainID:        "22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn",
		NetworkTimeout: 30,
	}
}

// GetConfigDir returns the config directory path
func GetConfigDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ".chaosstar"
	}
	return filepath.Join(home, ".chaosstar")
}

// LoadConfig loads configuration from file
func LoadConfig() (*Config, error) {
	configDir := GetConfigDir()
	configPath = filepath.Join(configDir, "config.json")

	// Create config directory if it doesn't exist
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return nil, err
	}

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create default config
		config = DefaultConfig()
		return config, SaveConfig(config)
	}

	// Read config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	config = &Config{}
	if err := json.Unmarshal(data, config); err != nil {
		return nil, err
	}

	return config, nil
}

// SaveConfig saves configuration to file
func SaveConfig(cfg *Config) error {
	configDir := GetConfigDir()
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(configDir, "config.json"), data, 0600)
}

// GetConfig returns the current config
func GetConfig() *Config {
	if config == nil {
		config, _ = LoadConfig()
	}
	return config
}

// configCmd handles configuration
var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Configuration commands",
	Long:  "View and modify CLI configuration",
}

func init() {
	rootCmd.AddCommand(configCmd)

	// config show
	configCmd.AddCommand(&cobra.Command{
		Use:   "show",
		Short: "Show current configuration",
		Run: func(cmd *cobra.Command, args []string) {
			cfg := GetConfig()
			data, _ := json.MarshalIndent(cfg, "", "  ")
			fmt.Println(string(data))
		},
	})

	// config set-endpoint
	configCmd.AddCommand(&cobra.Command{
		Use:   "set-endpoint [url]",
		Short: "Set RPC endpoint",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			cfg := GetConfig()
			cfg.RPCEndpoint = args[0]
			if err := SaveConfig(cfg); err != nil {
				fmt.Printf("Error saving config: %v\n", err)
				return
			}
			fmt.Printf("RPC endpoint set to: %s\n", args[0])
		},
	})

	// config set-key
	configCmd.AddCommand(&cobra.Command{
		Use:   "set-key [key-name]",
		Short: "Set default key",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			cfg := GetConfig()
			cfg.DefaultKey = args[0]
			if err := SaveConfig(cfg); err != nil {
				fmt.Printf("Error saving config: %v\n", err)
				return
			}
			fmt.Printf("Default key set to: %s\n", args[0])
		},
	})
}

