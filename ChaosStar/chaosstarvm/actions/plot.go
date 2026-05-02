// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Plot actions - purchase, upgrade, transfer plots

package actions

import (
	"context"
	"errors"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	"github.com/chaosstar/chaosstarvm/consts"
	"github.com/chaosstar/chaosstarvm/storage"
)

const (
	PlotComputeUnits = 5
)

var (
	ErrPlotAlreadyOwned   = errors.New("plot already owned")
	ErrPlotNotOwned       = errors.New("plot not owned")
	ErrNotPlotOwner       = errors.New("not plot owner")
	ErrInvalidCoordinates = errors.New("invalid coordinates")
	ErrInvalidLevel       = errors.New("invalid level")
)

// ============================================================================
// PLOT PURCHASE
// ============================================================================

var _ chain.Action = (*PlotPurchase)(nil)

type PlotPurchase struct {
	X     uint32 `serialize:"true" json:"x"`
	Y     uint32 `serialize:"true" json:"y"`
	Price uint64 `serialize:"true" json:"price"`
}

func (*PlotPurchase) GetTypeID() uint8 {
	return consts.PlotPurchaseID
}

func (p *PlotPurchase) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.PlotKey(p.X, p.Y)):                  state.All,
		string(storage.BalanceKey(actor, storage.DefaultTokenType)): state.Read | state.Write,
	}
}

func (p *PlotPurchase) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	exists, err := storage.PlotExists(ctx, mu, p.X, p.Y)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrPlotAlreadyOwned
	}

	_, err = storage.SubBalance(ctx, mu, actor, storage.DefaultTokenType, p.Price)
	if err != nil {
		return nil, err
	}

	plot := &storage.Plot{
		Owner:     actor,
		X:         p.X,
		Y:         p.Y,
		Level:     1,
		Resources: make(map[string]uint64),
	}
	if err := storage.SetPlot(ctx, mu, plot); err != nil {
		return nil, err
	}

	result := &PlotPurchaseResult{X: p.X, Y: p.Y, Owner: actor}
	return result.Bytes(), nil
}

func (*PlotPurchase) ComputeUnits(chain.Rules) uint64 {
	return PlotComputeUnits
}

func (*PlotPurchase) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (p *PlotPurchase) Bytes() []byte {
	return MarshalAction(consts.PlotPurchaseID, p)
}

type PlotPurchaseResult struct {
	X     uint32        `serialize:"true" json:"x"`
	Y     uint32        `serialize:"true" json:"y"`
	Owner codec.Address `serialize:"true" json:"owner"`
}

func (*PlotPurchaseResult) GetTypeID() uint8 {
	return consts.PlotPurchaseID
}

func (p *PlotPurchaseResult) Bytes() []byte {
	return MarshalAction(consts.PlotPurchaseID, p)
}

// ============================================================================
// PLOT UPGRADE
// ============================================================================

var _ chain.Action = (*PlotUpgrade)(nil)

type PlotUpgrade struct {
	X        uint32 `serialize:"true" json:"x"`
	Y        uint32 `serialize:"true" json:"y"`
	NewLevel uint8  `serialize:"true" json:"new_level"`
	Cost     uint64 `serialize:"true" json:"cost"`
}

func (*PlotUpgrade) GetTypeID() uint8 {
	return consts.PlotUpgradeID
}

func (p *PlotUpgrade) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.PlotKey(p.X, p.Y)):                  state.Read | state.Write,
		string(storage.BalanceKey(actor, storage.DefaultTokenType)): state.Read | state.Write,
	}
}

func (p *PlotUpgrade) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	plot, err := storage.GetPlot(ctx, mu, p.X, p.Y)
	if err != nil {
		return nil, ErrPlotNotOwned
	}

	if plot.Owner != actor {
		return nil, ErrNotPlotOwner
	}

	if p.NewLevel <= plot.Level {
		return nil, ErrInvalidLevel
	}

	_, err = storage.SubBalance(ctx, mu, actor, storage.DefaultTokenType, p.Cost)
	if err != nil {
		return nil, err
	}

	plot.Level = p.NewLevel
	if err := storage.SetPlot(ctx, mu, plot); err != nil {
		return nil, err
	}

	result := &PlotUpgradeResult{X: p.X, Y: p.Y, NewLevel: p.NewLevel}
	return result.Bytes(), nil
}

func (*PlotUpgrade) ComputeUnits(chain.Rules) uint64 {
	return PlotComputeUnits
}

func (*PlotUpgrade) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (p *PlotUpgrade) Bytes() []byte {
	return MarshalAction(consts.PlotUpgradeID, p)
}

type PlotUpgradeResult struct {
	X        uint32 `serialize:"true" json:"x"`
	Y        uint32 `serialize:"true" json:"y"`
	NewLevel uint8  `serialize:"true" json:"new_level"`
}

func (*PlotUpgradeResult) GetTypeID() uint8 {
	return consts.PlotUpgradeID
}

func (p *PlotUpgradeResult) Bytes() []byte {
	return MarshalAction(consts.PlotUpgradeID, p)
}

// ============================================================================
// PLOT TRANSFER
// ============================================================================

var _ chain.Action = (*PlotTransfer)(nil)

type PlotTransfer struct {
	X  uint32        `serialize:"true" json:"x"`
	Y  uint32        `serialize:"true" json:"y"`
	To codec.Address `serialize:"true" json:"to"`
}

func (*PlotTransfer) GetTypeID() uint8 {
	return consts.PlotTransferID
}

func (p *PlotTransfer) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.PlotKey(p.X, p.Y)): state.Read | state.Write,
	}
}

func (p *PlotTransfer) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	plot, err := storage.GetPlot(ctx, mu, p.X, p.Y)
	if err != nil {
		return nil, ErrPlotNotOwned
	}

	if plot.Owner != actor {
		return nil, ErrNotPlotOwner
	}

	plot.Owner = p.To
	if err := storage.SetPlot(ctx, mu, plot); err != nil {
		return nil, err
	}

	result := &PlotTransferResult{X: p.X, Y: p.Y, From: actor, To: p.To}
	return result.Bytes(), nil
}

func (*PlotTransfer) ComputeUnits(chain.Rules) uint64 {
	return PlotComputeUnits
}

func (*PlotTransfer) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (p *PlotTransfer) Bytes() []byte {
	return MarshalAction(consts.PlotTransferID, p)
}

type PlotTransferResult struct {
	X    uint32        `serialize:"true" json:"x"`
	Y    uint32        `serialize:"true" json:"y"`
	From codec.Address `serialize:"true" json:"from"`
	To   codec.Address `serialize:"true" json:"to"`
}

func (*PlotTransferResult) GetTypeID() uint8 {
	return consts.PlotTransferID
}

func (p *PlotTransferResult) Bytes() []byte {
	return MarshalAction(consts.PlotTransferID, p)
}
