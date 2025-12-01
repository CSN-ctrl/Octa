// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Star System actions - create and manage star systems (subnets)

package actions

import (
	"context"
	"crypto/sha256"
	"errors"
	"time"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	"github.com/chaosstar/chaosstarvm/consts"
	"github.com/chaosstar/chaosstarvm/storage"
)

const (
	StarSystemComputeUnits = 10
	MaxSystemNameLength    = 64
)

var (
	ErrStarSystemExists   = errors.New("star system already exists")
	ErrStarSystemNotFound = errors.New("star system not found")
	ErrInvalidSystemName  = errors.New("invalid system name")
)

func hashSystemID(systemID []byte) []byte {
	h := sha256.Sum256(systemID)
	return h[:]
}

// ============================================================================
// STAR SYSTEM CREATE
// ============================================================================

var _ chain.Action = (*StarSystemCreate)(nil)

type StarSystemCreate struct {
	SystemID   []byte `serialize:"true" json:"system_id"`
	Name       []byte `serialize:"true" json:"name"`
	SubnetID   []byte `serialize:"true" json:"subnet_id"`
	SubnetName []byte `serialize:"true" json:"subnet_name"`
	RPCURL     []byte `serialize:"true" json:"rpc_url"`
	ChainID    uint64 `serialize:"true" json:"chain_id"`
}

func (*StarSystemCreate) GetTypeID() uint8 { return consts.StarSystemCreateID }

func (s *StarSystemCreate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	systemIDHash := hashSystemID(s.SystemID)
	return state.Keys{string(storage.StarSystemKey(systemIDHash)): state.All}
}

func (s *StarSystemCreate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if len(s.Name) == 0 || len(s.Name) > MaxSystemNameLength {
		return nil, ErrInvalidSystemName
	}
	systemIDHash := hashSystemID(s.SystemID)
	exists, err := storage.StarSystemExists(ctx, mu, systemIDHash)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrStarSystemExists
	}
	var id [32]byte
	copy(id[:], systemIDHash)
	system := &storage.StarSystem{
		ID: id, Name: s.Name, Owner: actor, SubnetID: s.SubnetID,
		SubnetName: s.SubnetName, RPCURL: s.RPCURL, ChainID: s.ChainID,
		Status: consts.SystemDeploying, CreatedAt: uint64(time.Now().Unix()),
	}
	if err := storage.SetStarSystem(ctx, mu, system); err != nil {
		return nil, err
	}
	result := &StarSystemCreateResult{SystemID: s.SystemID, Name: s.Name, Owner: actor, Status: consts.SystemDeploying}
	return result.Bytes(), nil
}

func (*StarSystemCreate) ComputeUnits(chain.Rules) uint64   { return StarSystemComputeUnits }
func (*StarSystemCreate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (s *StarSystemCreate) Bytes() []byte                    { return MarshalAction(consts.StarSystemCreateID, s) }

type StarSystemCreateResult struct {
	SystemID []byte        `serialize:"true" json:"system_id"`
	Name     []byte        `serialize:"true" json:"name"`
	Owner    codec.Address `serialize:"true" json:"owner"`
	Status   uint8         `serialize:"true" json:"status"`
}

func (*StarSystemCreateResult) GetTypeID() uint8 { return consts.StarSystemCreateID }
func (r *StarSystemCreateResult) Bytes() []byte  { return MarshalAction(consts.StarSystemCreateID, r) }

// ============================================================================
// STAR SYSTEM UPDATE
// ============================================================================

var _ chain.Action = (*StarSystemUpdate)(nil)

type StarSystemUpdate struct {
	SystemID []byte `serialize:"true" json:"system_id"`
	Status   uint8  `serialize:"true" json:"status"`
	RPCURL   []byte `serialize:"true" json:"rpc_url"`
	ChainID  uint64 `serialize:"true" json:"chain_id"`
}

func (*StarSystemUpdate) GetTypeID() uint8 { return consts.StarSystemUpdateID }

func (s *StarSystemUpdate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	systemIDHash := hashSystemID(s.SystemID)
	return state.Keys{string(storage.StarSystemKey(systemIDHash)): state.Read | state.Write}
}

func (s *StarSystemUpdate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	systemIDHash := hashSystemID(s.SystemID)
	system, err := storage.GetStarSystem(ctx, mu, systemIDHash)
	if err != nil {
		return nil, ErrStarSystemNotFound
	}
	if system.Owner != actor {
		return nil, errors.New("not star system owner")
	}
	system.Status = s.Status
	if len(s.RPCURL) > 0 {
		system.RPCURL = s.RPCURL
	}
	if s.ChainID > 0 {
		system.ChainID = s.ChainID
	}
	if err := storage.SetStarSystem(ctx, mu, system); err != nil {
		return nil, err
	}
	result := &StarSystemUpdateResult{SystemID: s.SystemID, NewStatus: s.Status}
	return result.Bytes(), nil
}

func (*StarSystemUpdate) ComputeUnits(chain.Rules) uint64   { return StarSystemComputeUnits }
func (*StarSystemUpdate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (s *StarSystemUpdate) Bytes() []byte                    { return MarshalAction(consts.StarSystemUpdateID, s) }

type StarSystemUpdateResult struct {
	SystemID  []byte `serialize:"true" json:"system_id"`
	NewStatus uint8  `serialize:"true" json:"new_status"`
}

func (*StarSystemUpdateResult) GetTypeID() uint8 { return consts.StarSystemUpdateID }
func (r *StarSystemUpdateResult) Bytes() []byte  { return MarshalAction(consts.StarSystemUpdateID, r) }
