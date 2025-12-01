// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// ChaosStarVM - HyperSDK-based blockchain for the Chaos Star Network

package consts

import (
	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/version"
)

const (
	Name   = "chaosstarvm"
	Symbol = "CHAOS"
)

var ID ids.ID

func init() {
	b := make([]byte, ids.IDLen)
	copy(b, []byte(Name))
	vmID, err := ids.ToID(b)
	if err != nil {
		panic(err)
	}
	ID = vmID
}

var Version = &version.Semantic{
	Major: 1,
	Minor: 0,
	Patch: 0,
}


