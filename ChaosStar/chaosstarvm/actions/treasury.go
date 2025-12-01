// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Treasury actions - token swaps, validator rewards, cross-validator operations

package actions

import (
	"context"
	"crypto/sha256"
	"errors"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	"github.com/chaosstar/chaosstarvm/consts"
	"github.com/chaosstar/chaosstarvm/storage"
)

const (
	TreasuryComputeUnits = 5
	SwapComputeUnits     = 8
)

var (
	ErrInsufficientLiquidity = errors.New("insufficient treasury liquidity")
	ErrInvalidTokenType      = errors.New("invalid token type")
	ErrSameToken             = errors.New("cannot swap same token")
	ErrValidatorNotFound     = errors.New("validator not found")
	ErrValidatorExists       = errors.New("validator already exists")
)

func hashValidatorID(validatorID []byte) []byte {
	h := sha256.Sum256(validatorID)
	return h[:]
}

// ============================================================================
// TOKEN SWAP
// ============================================================================

var _ chain.Action = (*TokenSwap)(nil)

type TokenSwap struct {
	TokenIn  uint8  `serialize:"true" json:"token_in"`
	TokenOut uint8  `serialize:"true" json:"token_out"`
	AmountIn uint64 `serialize:"true" json:"amount_in"`
}

func (*TokenSwap) GetTypeID() uint8 { return consts.TokenSwapID }

func (t *TokenSwap) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor, t.TokenIn)):  state.Read | state.Write,
		string(storage.BalanceKey(actor, t.TokenOut)): state.Read | state.Write,
		string(storage.TreasuryKey(t.TokenIn)):        state.Read | state.Write,
		string(storage.TreasuryKey(t.TokenOut)):       state.Read | state.Write,
	}
}

func (t *TokenSwap) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if t.TokenIn == t.TokenOut {
		return nil, ErrSameToken
	}
	if t.TokenIn > 2 || t.TokenOut > 2 {
		return nil, ErrInvalidTokenType
	}
	fee := t.AmountIn / 100
	if fee == 0 && t.AmountIn > 0 {
		fee = 1
	}
	amountAfterFee := t.AmountIn - fee
	_, err := storage.SubBalance(ctx, mu, actor, t.TokenIn, t.AmountIn)
	if err != nil {
		return nil, err
	}
	_, err = storage.AddTreasuryBalance(ctx, mu, t.TokenIn, t.AmountIn)
	if err != nil {
		return nil, err
	}
	treasuryBalance, err := storage.GetTreasuryBalance(ctx, mu, t.TokenOut)
	if err != nil {
		return nil, err
	}
	if treasuryBalance < amountAfterFee {
		return nil, ErrInsufficientLiquidity
	}
	_, err = storage.SubTreasuryBalance(ctx, mu, t.TokenOut, amountAfterFee)
	if err != nil {
		return nil, err
	}
	newBalance, err := storage.AddBalance(ctx, mu, actor, t.TokenOut, amountAfterFee)
	if err != nil {
		return nil, err
	}
	result := &TokenSwapResult{TokenIn: t.TokenIn, TokenOut: t.TokenOut, AmountIn: t.AmountIn, AmountOut: amountAfterFee, Fee: fee, NewBalance: newBalance}
	return result.Bytes(), nil
}

func (*TokenSwap) ComputeUnits(chain.Rules) uint64   { return SwapComputeUnits }
func (*TokenSwap) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (t *TokenSwap) Bytes() []byte                    { return MarshalAction(consts.TokenSwapID, t) }

type TokenSwapResult struct {
	TokenIn    uint8  `serialize:"true" json:"token_in"`
	TokenOut   uint8  `serialize:"true" json:"token_out"`
	AmountIn   uint64 `serialize:"true" json:"amount_in"`
	AmountOut  uint64 `serialize:"true" json:"amount_out"`
	Fee        uint64 `serialize:"true" json:"fee"`
	NewBalance uint64 `serialize:"true" json:"new_balance"`
}

func (*TokenSwapResult) GetTypeID() uint8 { return consts.TokenSwapID }
func (r *TokenSwapResult) Bytes() []byte  { return MarshalAction(consts.TokenSwapID, r) }

// ============================================================================
// CROSS VALIDATOR SWAP
// ============================================================================

var _ chain.Action = (*CrossValidatorSwap)(nil)

type CrossValidatorSwap struct {
	FromValidatorID []byte `serialize:"true" json:"from_validator_id"`
	ToValidatorID   []byte `serialize:"true" json:"to_validator_id"`
	TokenIn         uint8  `serialize:"true" json:"token_in"`
	TokenOut        uint8  `serialize:"true" json:"token_out"`
	AmountIn        uint64 `serialize:"true" json:"amount_in"`
}

func (*CrossValidatorSwap) GetTypeID() uint8 { return consts.CrossValidatorSwapID }

func (c *CrossValidatorSwap) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	fromHash := hashValidatorID(c.FromValidatorID)
	toHash := hashValidatorID(c.ToValidatorID)
	return state.Keys{
		string(storage.ValidatorKey(fromHash)):        state.Read,
		string(storage.ValidatorKey(toHash)):          state.Read,
		string(storage.BalanceKey(actor, c.TokenIn)):  state.Read | state.Write,
		string(storage.BalanceKey(actor, c.TokenOut)): state.Read | state.Write,
		string(storage.TreasuryKey(c.TokenIn)):        state.Read | state.Write,
		string(storage.TreasuryKey(c.TokenOut)):       state.Read | state.Write,
	}
}

func (c *CrossValidatorSwap) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if c.TokenIn == c.TokenOut {
		return nil, ErrSameToken
	}
	fromHash := hashValidatorID(c.FromValidatorID)
	toHash := hashValidatorID(c.ToValidatorID)
	_, err := storage.GetValidator(ctx, mu, fromHash)
	if err != nil {
		return nil, ErrValidatorNotFound
	}
	_, err = storage.GetValidator(ctx, mu, toHash)
	if err != nil {
		return nil, ErrValidatorNotFound
	}
	fee := c.AmountIn / 100
	if fee == 0 && c.AmountIn > 0 {
		fee = 1
	}
	amountAfterFee := c.AmountIn - fee
	_, err = storage.SubBalance(ctx, mu, actor, c.TokenIn, c.AmountIn)
	if err != nil {
		return nil, err
	}
	_, err = storage.AddTreasuryBalance(ctx, mu, c.TokenIn, c.AmountIn)
	if err != nil {
		return nil, err
	}
	treasuryBalance, err := storage.GetTreasuryBalance(ctx, mu, c.TokenOut)
	if err != nil {
		return nil, err
	}
	if treasuryBalance < amountAfterFee {
		return nil, ErrInsufficientLiquidity
	}
	_, err = storage.SubTreasuryBalance(ctx, mu, c.TokenOut, amountAfterFee)
	if err != nil {
		return nil, err
	}
	newBalance, err := storage.AddBalance(ctx, mu, actor, c.TokenOut, amountAfterFee)
	if err != nil {
		return nil, err
	}
	result := &CrossValidatorSwapResult{FromValidatorID: c.FromValidatorID, ToValidatorID: c.ToValidatorID, AmountIn: c.AmountIn, AmountOut: amountAfterFee, Fee: fee, NewBalance: newBalance}
	return result.Bytes(), nil
}

func (*CrossValidatorSwap) ComputeUnits(chain.Rules) uint64   { return SwapComputeUnits * 2 }
func (*CrossValidatorSwap) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (c *CrossValidatorSwap) Bytes() []byte                    { return MarshalAction(consts.CrossValidatorSwapID, c) }

type CrossValidatorSwapResult struct {
	FromValidatorID []byte `serialize:"true" json:"from_validator_id"`
	ToValidatorID   []byte `serialize:"true" json:"to_validator_id"`
	AmountIn        uint64 `serialize:"true" json:"amount_in"`
	AmountOut       uint64 `serialize:"true" json:"amount_out"`
	Fee             uint64 `serialize:"true" json:"fee"`
	NewBalance      uint64 `serialize:"true" json:"new_balance"`
}

func (*CrossValidatorSwapResult) GetTypeID() uint8 { return consts.CrossValidatorSwapID }
func (r *CrossValidatorSwapResult) Bytes() []byte  { return MarshalAction(consts.CrossValidatorSwapID, r) }

// ============================================================================
// VALIDATOR REGISTER
// ============================================================================

var _ chain.Action = (*ValidatorRegister)(nil)

type ValidatorRegister struct {
	ValidatorID []byte `serialize:"true" json:"validator_id"`
	Name        []byte `serialize:"true" json:"name"`
	NativeToken uint8  `serialize:"true" json:"native_token"`
}

func (*ValidatorRegister) GetTypeID() uint8 { return consts.ValidatorRegisterID }

func (v *ValidatorRegister) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	validatorIDHash := hashValidatorID(v.ValidatorID)
	return state.Keys{string(storage.ValidatorKey(validatorIDHash)): state.All}
}

func (v *ValidatorRegister) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	validatorIDHash := hashValidatorID(v.ValidatorID)
	exists, err := storage.ValidatorExists(ctx, mu, validatorIDHash)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrValidatorExists
	}
	var id [32]byte
	copy(id[:], validatorIDHash)
	validator := &storage.Validator{ID: id, Name: v.Name, NativeToken: v.NativeToken, StakingAmount: 0, XBGLRewards: 0, Active: true}
	if err := storage.SetValidator(ctx, mu, validator); err != nil {
		return nil, err
	}
	result := &ValidatorRegisterResult{ValidatorID: v.ValidatorID, Name: v.Name, NativeToken: v.NativeToken}
	return result.Bytes(), nil
}

func (*ValidatorRegister) ComputeUnits(chain.Rules) uint64   { return TreasuryComputeUnits }
func (*ValidatorRegister) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (v *ValidatorRegister) Bytes() []byte                    { return MarshalAction(consts.ValidatorRegisterID, v) }

type ValidatorRegisterResult struct {
	ValidatorID []byte `serialize:"true" json:"validator_id"`
	Name        []byte `serialize:"true" json:"name"`
	NativeToken uint8  `serialize:"true" json:"native_token"`
}

func (*ValidatorRegisterResult) GetTypeID() uint8 { return consts.ValidatorRegisterID }
func (r *ValidatorRegisterResult) Bytes() []byte  { return MarshalAction(consts.ValidatorRegisterID, r) }

// ============================================================================
// TREASURY DEPOSIT
// ============================================================================

var _ chain.Action = (*TreasuryDeposit)(nil)

type TreasuryDeposit struct {
	TokenType uint8  `serialize:"true" json:"token_type"`
	Amount    uint64 `serialize:"true" json:"amount"`
}

func (*TreasuryDeposit) GetTypeID() uint8 { return consts.TreasuryDepositID }

func (t *TreasuryDeposit) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor, t.TokenType)): state.Read | state.Write,
		string(storage.TreasuryKey(t.TokenType)):       state.Read | state.Write,
	}
}

func (t *TreasuryDeposit) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if t.TokenType > 2 {
		return nil, ErrInvalidTokenType
	}
	_, err := storage.SubBalance(ctx, mu, actor, t.TokenType, t.Amount)
	if err != nil {
		return nil, err
	}
	newTreasuryBalance, err := storage.AddTreasuryBalance(ctx, mu, t.TokenType, t.Amount)
	if err != nil {
		return nil, err
	}
	result := &TreasuryDepositResult{TokenType: t.TokenType, Amount: t.Amount, NewTreasuryBalance: newTreasuryBalance}
	return result.Bytes(), nil
}

func (*TreasuryDeposit) ComputeUnits(chain.Rules) uint64   { return TreasuryComputeUnits }
func (*TreasuryDeposit) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (t *TreasuryDeposit) Bytes() []byte                    { return MarshalAction(consts.TreasuryDepositID, t) }

type TreasuryDepositResult struct {
	TokenType          uint8  `serialize:"true" json:"token_type"`
	Amount             uint64 `serialize:"true" json:"amount"`
	NewTreasuryBalance uint64 `serialize:"true" json:"new_treasury_balance"`
}

func (*TreasuryDepositResult) GetTypeID() uint8 { return consts.TreasuryDepositID }
func (r *TreasuryDepositResult) Bytes() []byte  { return MarshalAction(consts.TreasuryDepositID, r) }
