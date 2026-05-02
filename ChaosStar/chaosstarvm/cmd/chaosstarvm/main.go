// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// ChaosStarVM - Main entry point for the VM binary

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/ava-labs/avalanchego/utils/logging"
	"github.com/ava-labs/avalanchego/utils/ulimit"
	"github.com/ava-labs/avalanchego/vms/rpcchainvm"
	"github.com/spf13/cobra"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/snow"

	"github.com/chaosstar/chaosstarvm/cmd/chaosstarvm/version"
	mvm "github.com/chaosstar/chaosstarvm/vm"
)

var rootCmd = &cobra.Command{
	Use:        "chaosstarvm",
	Short:      "ChaosStarVM agent",
	SuggestFor: []string{"chaosstarvm"},
	RunE:       runFunc,
}

func init() {
	cobra.EnablePrefixMatching = true
	rootCmd.AddCommand(version.NewCommand())
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "chaosstarvm failed %v\n", err)
		os.Exit(1)
	}
	os.Exit(0)
}

func runFunc(*cobra.Command, []string) error {
	if err := ulimit.Set(ulimit.DefaultFDLimit, logging.NoLog{}); err != nil {
		return fmt.Errorf("%w: failed to set fd limit correctly", err)
	}

	v, err := mvm.New()
	if err != nil {
		return err
	}

	return rpcchainvm.Serve(context.TODO(), snow.NewSnowVM[*chain.ExecutionBlock, *chain.OutputBlock, *chain.OutputBlock]("v1.0.0", v))
}
