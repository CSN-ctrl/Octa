// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Version command for ChaosStarVM

package version

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/chaosstar/chaosstarvm/consts"
)

func NewCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the version of ChaosStarVM",
		RunE: func(*cobra.Command, []string) error {
			fmt.Printf("ChaosStarVM %s\n", consts.Version.String())
			return nil
		},
	}
}
