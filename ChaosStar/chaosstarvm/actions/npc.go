// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// NPC actions - create, train, assign, relocate NPCs

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
	NPCComputeUnits = 3
	MaxNPCIDLength  = 64
	MaxTaskLength   = 256
)

var (
	ErrNPCAlreadyExists = errors.New("NPC already exists")
	ErrNPCNotFound      = errors.New("NPC not found")
	ErrNotNPCOwner      = errors.New("not NPC owner")
	ErrInvalidNPCID     = errors.New("invalid NPC ID")
)

func hashNPCID(npcID []byte) []byte {
	h := sha256.Sum256(npcID)
	return h[:]
}

// ============================================================================
// NPC CREATE
// ============================================================================

var _ chain.Action = (*NPCCreate)(nil)

type NPCCreate struct {
	NPCID     []byte `serialize:"true" json:"npc_id"`
	LocationX uint32 `serialize:"true" json:"location_x"`
	LocationY uint32 `serialize:"true" json:"location_y"`
}

func (*NPCCreate) GetTypeID() uint8 { return consts.NPCCreateID }

func (n *NPCCreate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	npcIDHash := hashNPCID(n.NPCID)
	return state.Keys{string(storage.NPCKey(npcIDHash)): state.All}
}

func (n *NPCCreate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if len(n.NPCID) == 0 || len(n.NPCID) > MaxNPCIDLength {
		return nil, ErrInvalidNPCID
	}
	npcIDHash := hashNPCID(n.NPCID)
	exists, err := storage.NPCExists(ctx, mu, npcIDHash)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrNPCAlreadyExists
	}
	var id [32]byte
	copy(id[:], npcIDHash)
	npc := &storage.NPC{ID: id, Owner: actor, LocationX: n.LocationX, LocationY: n.LocationY, Loyalty: 50, AssignedTask: nil}
	if err := storage.SetNPC(ctx, mu, npc); err != nil {
		return nil, err
	}
	result := &NPCCreateResult{NPCID: n.NPCID, Owner: actor, LocationX: n.LocationX, LocationY: n.LocationY}
	return result.Bytes(), nil
}

func (*NPCCreate) ComputeUnits(chain.Rules) uint64   { return NPCComputeUnits }
func (*NPCCreate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (n *NPCCreate) Bytes() []byte                    { return MarshalAction(consts.NPCCreateID, n) }

type NPCCreateResult struct {
	NPCID     []byte        `serialize:"true" json:"npc_id"`
	Owner     codec.Address `serialize:"true" json:"owner"`
	LocationX uint32        `serialize:"true" json:"location_x"`
	LocationY uint32        `serialize:"true" json:"location_y"`
}

func (*NPCCreateResult) GetTypeID() uint8 { return consts.NPCCreateID }
func (r *NPCCreateResult) Bytes() []byte  { return MarshalAction(consts.NPCCreateID, r) }

// ============================================================================
// NPC TRAIN
// ============================================================================

var _ chain.Action = (*NPCTrain)(nil)

type NPCTrain struct {
	NPCID      []byte `serialize:"true" json:"npc_id"`
	Skill      []byte `serialize:"true" json:"skill"`
	Experience uint64 `serialize:"true" json:"experience"`
}

func (*NPCTrain) GetTypeID() uint8 { return consts.NPCTrainID }

func (n *NPCTrain) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	npcIDHash := hashNPCID(n.NPCID)
	return state.Keys{string(storage.NPCKey(npcIDHash)): state.Read | state.Write}
}

func (n *NPCTrain) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	npcIDHash := hashNPCID(n.NPCID)
	npc, err := storage.GetNPC(ctx, mu, npcIDHash)
	if err != nil {
		return nil, ErrNPCNotFound
	}
	if npc.Owner != actor {
		return nil, ErrNotNPCOwner
	}
	if npc.Loyalty < 100 {
		npc.Loyalty++
	}
	if err := storage.SetNPC(ctx, mu, npc); err != nil {
		return nil, err
	}
	result := &NPCTrainResult{NPCID: n.NPCID, Skill: n.Skill, NewExperience: n.Experience, NewLoyalty: npc.Loyalty}
	return result.Bytes(), nil
}

func (*NPCTrain) ComputeUnits(chain.Rules) uint64   { return NPCComputeUnits }
func (*NPCTrain) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (n *NPCTrain) Bytes() []byte                    { return MarshalAction(consts.NPCTrainID, n) }

type NPCTrainResult struct {
	NPCID         []byte `serialize:"true" json:"npc_id"`
	Skill         []byte `serialize:"true" json:"skill"`
	NewExperience uint64 `serialize:"true" json:"new_experience"`
	NewLoyalty    uint8  `serialize:"true" json:"new_loyalty"`
}

func (*NPCTrainResult) GetTypeID() uint8 { return consts.NPCTrainID }
func (r *NPCTrainResult) Bytes() []byte  { return MarshalAction(consts.NPCTrainID, r) }

// ============================================================================
// NPC ASSIGN
// ============================================================================

var _ chain.Action = (*NPCAssign)(nil)

type NPCAssign struct {
	NPCID     []byte `serialize:"true" json:"npc_id"`
	Task      []byte `serialize:"true" json:"task"`
	LocationX uint32 `serialize:"true" json:"location_x"`
	LocationY uint32 `serialize:"true" json:"location_y"`
}

func (*NPCAssign) GetTypeID() uint8 { return consts.NPCAssignID }

func (n *NPCAssign) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	npcIDHash := hashNPCID(n.NPCID)
	return state.Keys{string(storage.NPCKey(npcIDHash)): state.Read | state.Write}
}

func (n *NPCAssign) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if len(n.Task) > MaxTaskLength {
		return nil, errors.New("task too long")
	}
	npcIDHash := hashNPCID(n.NPCID)
	npc, err := storage.GetNPC(ctx, mu, npcIDHash)
	if err != nil {
		return nil, ErrNPCNotFound
	}
	if npc.Owner != actor {
		return nil, ErrNotNPCOwner
	}
	npc.AssignedTask = n.Task
	npc.LocationX = n.LocationX
	npc.LocationY = n.LocationY
	if err := storage.SetNPC(ctx, mu, npc); err != nil {
		return nil, err
	}
	result := &NPCAssignResult{NPCID: n.NPCID, Task: n.Task, LocationX: n.LocationX, LocationY: n.LocationY}
	return result.Bytes(), nil
}

func (*NPCAssign) ComputeUnits(chain.Rules) uint64   { return NPCComputeUnits }
func (*NPCAssign) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (n *NPCAssign) Bytes() []byte                    { return MarshalAction(consts.NPCAssignID, n) }

type NPCAssignResult struct {
	NPCID     []byte `serialize:"true" json:"npc_id"`
	Task      []byte `serialize:"true" json:"task"`
	LocationX uint32 `serialize:"true" json:"location_x"`
	LocationY uint32 `serialize:"true" json:"location_y"`
}

func (*NPCAssignResult) GetTypeID() uint8 { return consts.NPCAssignID }
func (r *NPCAssignResult) Bytes() []byte  { return MarshalAction(consts.NPCAssignID, r) }

// ============================================================================
// NPC RELOCATE
// ============================================================================

var _ chain.Action = (*NPCRelocate)(nil)

type NPCRelocate struct {
	NPCID        []byte `serialize:"true" json:"npc_id"`
	NewLocationX uint32 `serialize:"true" json:"new_location_x"`
	NewLocationY uint32 `serialize:"true" json:"new_location_y"`
}

func (*NPCRelocate) GetTypeID() uint8 { return consts.NPCRelocateID }

func (n *NPCRelocate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	npcIDHash := hashNPCID(n.NPCID)
	return state.Keys{string(storage.NPCKey(npcIDHash)): state.Read | state.Write}
}

func (n *NPCRelocate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	npcIDHash := hashNPCID(n.NPCID)
	npc, err := storage.GetNPC(ctx, mu, npcIDHash)
	if err != nil {
		return nil, ErrNPCNotFound
	}
	if npc.Owner != actor {
		return nil, ErrNotNPCOwner
	}
	if npc.Loyalty >= 5 {
		npc.Loyalty -= 5
	} else {
		npc.Loyalty = 0
	}
	npc.LocationX = n.NewLocationX
	npc.LocationY = n.NewLocationY
	if err := storage.SetNPC(ctx, mu, npc); err != nil {
		return nil, err
	}
	result := &NPCRelocateResult{NPCID: n.NPCID, NewLocationX: n.NewLocationX, NewLocationY: n.NewLocationY, NewLoyalty: npc.Loyalty}
	return result.Bytes(), nil
}

func (*NPCRelocate) ComputeUnits(chain.Rules) uint64   { return NPCComputeUnits }
func (*NPCRelocate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (n *NPCRelocate) Bytes() []byte                    { return MarshalAction(consts.NPCRelocateID, n) }

type NPCRelocateResult struct {
	NPCID        []byte `serialize:"true" json:"npc_id"`
	NewLocationX uint32 `serialize:"true" json:"new_location_x"`
	NewLocationY uint32 `serialize:"true" json:"new_location_y"`
	NewLoyalty   uint8  `serialize:"true" json:"new_loyalty"`
}

func (*NPCRelocateResult) GetTypeID() uint8 { return consts.NPCRelocateID }
func (r *NPCRelocateResult) Bytes() []byte  { return MarshalAction(consts.NPCRelocateID, r) }
