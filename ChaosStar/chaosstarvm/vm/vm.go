// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// ChaosStarVM - Main VM implementation

package vm

import (
	"errors"

	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/genesis"
	"github.com/ava-labs/hypersdk/state/metadata"
	"github.com/ava-labs/hypersdk/vm"
	"github.com/ava-labs/hypersdk/vm/defaultvm"

	"github.com/chaosstar/chaosstarvm/actions"
	"github.com/chaosstar/chaosstarvm/consts"
	"github.com/chaosstar/chaosstarvm/storage"
)

var (
	ActionParser *codec.TypeParser[chain.Action]
	AuthParser   *codec.TypeParser[chain.Auth]
	OutputParser *codec.TypeParser[codec.Typed]

	AuthProvider *auth.AuthProvider
)

// Setup types
func init() {
	ActionParser = codec.NewTypeParser[chain.Action]()
	AuthParser = codec.NewTypeParser[chain.Auth]()
	OutputParser = codec.NewTypeParser[codec.Typed]()
	AuthProvider = auth.NewAuthProvider()

	if err := auth.WithDefaultPrivateKeyFactories(AuthProvider); err != nil {
		panic(err)
	}

	if err := errors.Join(
		// ============================================================================
		// REGISTER ACTIONS
		// ============================================================================

		// Basic Transfer (ID: 0)
		ActionParser.Register(&actions.Transfer{}, nil),

		// Plot Actions
		ActionParser.Register(&actions.PlotPurchase{}, nil),
		ActionParser.Register(&actions.PlotUpgrade{}, nil),
		ActionParser.Register(&actions.PlotTransfer{}, nil),

		// NPC Actions
		ActionParser.Register(&actions.NPCCreate{}, nil),
		ActionParser.Register(&actions.NPCTrain{}, nil),
		ActionParser.Register(&actions.NPCAssign{}, nil),
		ActionParser.Register(&actions.NPCRelocate{}, nil),

		// Star System Actions
		ActionParser.Register(&actions.StarSystemCreate{}, nil),
		ActionParser.Register(&actions.StarSystemUpdate{}, nil),

		// Planet Actions
		ActionParser.Register(&actions.PlanetCreate{}, nil),
		ActionParser.Register(&actions.PlanetUpdate{}, nil),

		// City Actions
		ActionParser.Register(&actions.CityCreate{}, nil),
		ActionParser.Register(&actions.CityUpdateEconomy{}, nil),

		// Treasury Actions
		ActionParser.Register(&actions.TokenSwap{}, nil),
		ActionParser.Register(&actions.CrossValidatorSwap{}, nil),
		ActionParser.Register(&actions.ValidatorRegister{}, nil),
		ActionParser.Register(&actions.TreasuryDeposit{}, nil),

		// ============================================================================
		// REGISTER AUTH TYPES
		// ============================================================================
		AuthParser.Register(&auth.ED25519{}, auth.UnmarshalED25519),
		AuthParser.Register(&auth.SECP256R1{}, auth.UnmarshalSECP256R1),
		AuthParser.Register(&auth.BLS{}, auth.UnmarshalBLS),

		// ============================================================================
		// REGISTER OUTPUT TYPES
		// ============================================================================
		OutputParser.Register(&actions.TransferResult{}, nil),
		OutputParser.Register(&actions.PlotPurchaseResult{}, nil),
		OutputParser.Register(&actions.PlotUpgradeResult{}, nil),
		OutputParser.Register(&actions.PlotTransferResult{}, nil),
		OutputParser.Register(&actions.NPCCreateResult{}, nil),
		OutputParser.Register(&actions.NPCTrainResult{}, nil),
		OutputParser.Register(&actions.NPCAssignResult{}, nil),
		OutputParser.Register(&actions.NPCRelocateResult{}, nil),
		OutputParser.Register(&actions.StarSystemCreateResult{}, nil),
		OutputParser.Register(&actions.StarSystemUpdateResult{}, nil),
		OutputParser.Register(&actions.PlanetCreateResult{}, nil),
		OutputParser.Register(&actions.PlanetUpdateResult{}, nil),
		OutputParser.Register(&actions.CityCreateResult{}, nil),
		OutputParser.Register(&actions.CityUpdateEconomyResult{}, nil),
		OutputParser.Register(&actions.TokenSwapResult{}, nil),
		OutputParser.Register(&actions.CrossValidatorSwapResult{}, nil),
		OutputParser.Register(&actions.ValidatorRegisterResult{}, nil),
		OutputParser.Register(&actions.TreasuryDepositResult{}, nil),
	); err != nil {
		panic(err)
	}
}

// New returns a VM with the specified options
func New(options ...vm.Option) (*vm.VM, error) {
	factory := NewFactory()
	return factory.New(options...)
}

func NewFactory() *vm.Factory {
	options := defaultvm.NewDefaultOptions()
	return vm.NewFactory(
		genesis.DefaultGenesisFactory{},
		&storage.BalanceHandler{},
		metadata.NewDefaultManager(),
		ActionParser,
		AuthParser,
		OutputParser,
		auth.DefaultEngines(),
		options...,
	)
}

// Version returns the version of the ChaosStarVM
func Version() string {
	return consts.Version.String()
}
