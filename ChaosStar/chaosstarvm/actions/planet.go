// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Planet actions - create and manage planets (validators)

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
	PlanetComputeUnits  = 8
	MaxPlanetNameLength = 64
)

var (
	ErrPlanetExists      = errors.New("planet already exists")
	ErrPlanetNotFound    = errors.New("planet not found")
	ErrInvalidPlanetName = errors.New("invalid planet name")
)

func hashPlanetID(planetID []byte) []byte {
	h := sha256.Sum256(planetID)
	return h[:]
}

// ============================================================================
// PLANET CREATE
// ============================================================================

var _ chain.Action = (*PlanetCreate)(nil)

type PlanetCreate struct {
	PlanetID     []byte `serialize:"true" json:"planet_id"`
	Name         []byte `serialize:"true" json:"name"`
	StarSystemID []byte `serialize:"true" json:"star_system_id"`
	NodeID       []byte `serialize:"true" json:"node_id"`
	NodeAddress  []byte `serialize:"true" json:"node_address"`
	PlanetType   uint8  `serialize:"true" json:"planet_type"`
}

func (*PlanetCreate) GetTypeID() uint8 { return consts.PlanetCreateID }

func (p *PlanetCreate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	planetIDHash := hashPlanetID(p.PlanetID)
	systemIDHash := hashSystemID(p.StarSystemID)
	return state.Keys{
		string(storage.PlanetKey(planetIDHash)):     state.All,
		string(storage.StarSystemKey(systemIDHash)): state.Read,
	}
}

func (p *PlanetCreate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if len(p.Name) == 0 || len(p.Name) > MaxPlanetNameLength {
		return nil, ErrInvalidPlanetName
	}
	planetIDHash := hashPlanetID(p.PlanetID)
	exists, err := storage.PlanetExists(ctx, mu, planetIDHash)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrPlanetExists
	}
	systemIDHash := hashSystemID(p.StarSystemID)
	_, err = storage.GetStarSystem(ctx, mu, systemIDHash)
	if err != nil {
		return nil, ErrStarSystemNotFound
	}
	var id [32]byte
	copy(id[:], planetIDHash)
	planet := &storage.Planet{
		ID: id, Name: p.Name, Owner: actor, StarSystemID: p.StarSystemID,
		NodeID: p.NodeID, NodeAddress: p.NodeAddress, PlanetType: p.PlanetType,
		Active: true, CreatedAt: uint64(time.Now().Unix()),
	}
	if err := storage.SetPlanet(ctx, mu, planet); err != nil {
		return nil, err
	}
	result := &PlanetCreateResult{PlanetID: p.PlanetID, Name: p.Name, Owner: actor, StarSystemID: p.StarSystemID, PlanetType: p.PlanetType}
	return result.Bytes(), nil
}

func (*PlanetCreate) ComputeUnits(chain.Rules) uint64   { return PlanetComputeUnits }
func (*PlanetCreate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (p *PlanetCreate) Bytes() []byte                    { return MarshalAction(consts.PlanetCreateID, p) }

type PlanetCreateResult struct {
	PlanetID     []byte        `serialize:"true" json:"planet_id"`
	Name         []byte        `serialize:"true" json:"name"`
	Owner        codec.Address `serialize:"true" json:"owner"`
	StarSystemID []byte        `serialize:"true" json:"star_system_id"`
	PlanetType   uint8         `serialize:"true" json:"planet_type"`
}

func (*PlanetCreateResult) GetTypeID() uint8 { return consts.PlanetCreateID }
func (r *PlanetCreateResult) Bytes() []byte  { return MarshalAction(consts.PlanetCreateID, r) }

// ============================================================================
// PLANET UPDATE
// ============================================================================

var _ chain.Action = (*PlanetUpdate)(nil)

type PlanetUpdate struct {
	PlanetID    []byte `serialize:"true" json:"planet_id"`
	Active      bool   `serialize:"true" json:"active"`
	NodeAddress []byte `serialize:"true" json:"node_address"`
}

func (*PlanetUpdate) GetTypeID() uint8 { return consts.PlanetUpdateID }

func (p *PlanetUpdate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	planetIDHash := hashPlanetID(p.PlanetID)
	return state.Keys{string(storage.PlanetKey(planetIDHash)): state.Read | state.Write}
}

func (p *PlanetUpdate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	planetIDHash := hashPlanetID(p.PlanetID)
	planet, err := storage.GetPlanet(ctx, mu, planetIDHash)
	if err != nil {
		return nil, ErrPlanetNotFound
	}
	if planet.Owner != actor {
		return nil, errors.New("not planet owner")
	}
	planet.Active = p.Active
	if len(p.NodeAddress) > 0 {
		planet.NodeAddress = p.NodeAddress
	}
	if err := storage.SetPlanet(ctx, mu, planet); err != nil {
		return nil, err
	}
	result := &PlanetUpdateResult{PlanetID: p.PlanetID, Active: p.Active}
	return result.Bytes(), nil
}

func (*PlanetUpdate) ComputeUnits(chain.Rules) uint64   { return PlanetComputeUnits }
func (*PlanetUpdate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (p *PlanetUpdate) Bytes() []byte                    { return MarshalAction(consts.PlanetUpdateID, p) }

type PlanetUpdateResult struct {
	PlanetID []byte `serialize:"true" json:"planet_id"`
	Active   bool   `serialize:"true" json:"active"`
}

func (*PlanetUpdateResult) GetTypeID() uint8 { return consts.PlanetUpdateID }
func (r *PlanetUpdateResult) Bytes() []byte  { return MarshalAction(consts.PlanetUpdateID, r) }
