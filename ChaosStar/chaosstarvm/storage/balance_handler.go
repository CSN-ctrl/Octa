// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Balance handler for ChaosStarVM (multi-token support)

package storage

import (
	"context"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

// We use the same token type constant for default operations
const DefaultTokenType = 0 // xBGL as default

var _ chain.BalanceHandler = (*BalanceHandler)(nil)

type BalanceHandler struct{}

func (*BalanceHandler) SponsorStateKeys(addr codec.Address) state.Keys {
	return state.Keys{
		string(BalanceKey(addr, DefaultTokenType)): state.Read | state.Write,
	}
}

func (*BalanceHandler) CanDeduct(
	ctx context.Context,
	addr codec.Address,
	im state.Immutable,
	amount uint64,
) error {
	bal, err := GetBalance(ctx, im, addr, DefaultTokenType)
	if err != nil {
		return err
	}
	if bal < amount {
		return ErrInvalidBalance
	}
	return nil
}

func (*BalanceHandler) Deduct(
	ctx context.Context,
	addr codec.Address,
	mu state.Mutable,
	amount uint64,
) error {
	_, err := SubBalance(ctx, mu, addr, DefaultTokenType, amount)
	return err
}

func (*BalanceHandler) AddBalance(
	ctx context.Context,
	addr codec.Address,
	mu state.Mutable,
	amount uint64,
) error {
	_, err := AddBalance(ctx, mu, addr, DefaultTokenType, amount)
	return err
}

func (*BalanceHandler) GetBalance(
	ctx context.Context,
	addr codec.Address,
	im state.Immutable,
) (uint64, error) {
	return GetBalance(ctx, im, addr, DefaultTokenType)
}

// Multi-token specific methods

// GetTokenBalance returns balance for a specific token type
func GetTokenBalance(ctx context.Context, im state.Immutable, addr codec.Address, tokenType uint8) (uint64, error) {
	return GetBalance(ctx, im, addr, tokenType)
}

// AddTokenBalance adds balance for a specific token type
func AddTokenBalance(ctx context.Context, mu state.Mutable, addr codec.Address, tokenType uint8, amount uint64) (uint64, error) {
	return AddBalance(ctx, mu, addr, tokenType, amount)
}

// SubTokenBalance subtracts balance for a specific token type
func SubTokenBalance(ctx context.Context, mu state.Mutable, addr codec.Address, tokenType uint8, amount uint64) (uint64, error) {
	return SubBalance(ctx, mu, addr, tokenType, amount)
}

// TokenStateKeys returns state keys for a specific token type
func TokenStateKeys(addr codec.Address, tokenType uint8) state.Keys {
	return state.Keys{
		string(BalanceKey(addr, tokenType)): state.Read | state.Write,
	}
}
