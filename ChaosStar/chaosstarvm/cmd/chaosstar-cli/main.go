// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// ChaosStarVM CLI - Command line interface for interacting with ChaosStarVM

package main

import (
	"os"

	"github.com/chaosstar/chaosstarvm/cmd/chaosstar-cli/cmd"
)

func main() {
	// Setup shell as default mode when no args provided
	cmd.SetupShellMode()
	
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}

