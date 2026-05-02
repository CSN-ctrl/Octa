// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Transfer action - basic multi-token transfer

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
	TransferComputeUnits = 1
	MaxMemoSize          = 256
)

var (
	ErrOutputValueZero    = errors.New("value is zero")
	ErrOutputMemoTooLarge = errors.New("memo is too large")
	_                     chain.Action = (*Transfer)(nil)
)

// Transfer represents a token transfer between accounts
type Transfer struct {
	// To is the recipient of the [Value]
	To codec.Address `serialize:"true" json:"to"`

	// Value is the amount to transfer
	Value uint64 `serialize:"true" json:"value"`

	// TokenType: 0=xBGL, 1=Chaos, 2=Xen
	TokenType uint8 `serialize:"true" json:"token_type"`

	// Optional memo
	Memo []byte `serialize:"true" json:"memo"`
}

func (*Transfer) GetTypeID() uint8 {
	return consts.TransferID
}

func (t *Transfer) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor, t.TokenType)): state.Read | state.Write,
		string(storage.BalanceKey(t.To, t.TokenType)):  state.All,
	}
}

func (t *Transfer) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	if t.Value == 0 {
		return nil, ErrOutputValueZero
	}
	if len(t.Memo) > MaxMemoSize {
		return nil, ErrOutputMemoTooLarge
	}

	// Subtract from sender
	senderBalance, err := storage.SubTokenBalance(ctx, mu, actor, t.TokenType, t.Value)
	if err != nil {
		return nil, err
	}

	// Add to receiver
	receiverBalance, err := storage.AddTokenBalance(ctx, mu, t.To, t.TokenType, t.Value)
	if err != nil {
		return nil, err
	}

	result := &TransferResult{
		SenderBalance:   senderBalance,
		ReceiverBalance: receiverBalance,
	}
	return result.Bytes(), nil
}

func (*Transfer) ComputeUnits(chain.Rules) uint64 {
	return TransferComputeUnits
}

func (*Transfer) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (t *Transfer) Bytes() []byte {
	return MarshalAction(consts.TransferID, t)
}

var _ codec.Typed = (*TransferResult)(nil)

type TransferResult struct {
	SenderBalance   uint64 `serialize:"true" json:"sender_balance"`
	ReceiverBalance uint64 `serialize:"true" json:"receiver_balance"`
}

func (*TransferResult) GetTypeID() uint8 {
	return consts.TransferID
}

func (t *TransferResult) Bytes() []byte {
	return MarshalAction(consts.TransferID, t)
}
