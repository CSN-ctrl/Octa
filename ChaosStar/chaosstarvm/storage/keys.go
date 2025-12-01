// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// State key management for ChaosStarVM

package storage

import (
	"encoding/binary"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/consts"
	"github.com/ava-labs/hypersdk/state/metadata"
)

// State prefixes for different data types
// Using metadata.DefaultMinimumPrefix as base to avoid conflicts with HyperSDK internal state
const (
	balancePrefix     byte = metadata.DefaultMinimumPrefix + iota // Multi-token balances
	plotPrefix                                                     // Plot data
	npcPrefix                                                      // NPC data
	starSystemPrefix                                               // Star system data
	planetPrefix                                                   // Planet data
	cityPrefix                                                     // City data
	validatorPrefix                                                // Validator data
	treasuryPrefix                                                 // Treasury data
	npcOwnerPrefix                                                 // NPC owner index
	plotOwnerPrefix                                                // Plot owner index
)

const BalanceChunks uint16 = 1
const PlotChunks uint16 = 2
const NPCChunks uint16 = 3
const StarSystemChunks uint16 = 2
const PlanetChunks uint16 = 2
const CityChunks uint16 = 3
const ValidatorChunks uint16 = 2
const TreasuryChunks uint16 = 2

// BalanceKey creates a key for multi-token balance storage
// Format: [prefix][address][tokenType][chunks]
func BalanceKey(addr codec.Address, tokenType uint8) []byte {
	k := make([]byte, 1+codec.AddressLen+1+consts.Uint16Len)
	k[0] = balancePrefix
	copy(k[1:], addr[:])
	k[1+codec.AddressLen] = tokenType
	binary.BigEndian.PutUint16(k[1+codec.AddressLen+1:], BalanceChunks)
	return k
}

// PlotKey creates a key for plot storage
// Format: [prefix][x][y][chunks]
func PlotKey(x, y uint32) []byte {
	k := make([]byte, 1+4+4+consts.Uint16Len)
	k[0] = plotPrefix
	binary.BigEndian.PutUint32(k[1:], x)
	binary.BigEndian.PutUint32(k[5:], y)
	binary.BigEndian.PutUint16(k[9:], PlotChunks)
	return k
}

// NPCKey creates a key for NPC storage
// Format: [prefix][npcID hash][chunks]
func NPCKey(npcID []byte) []byte {
	k := make([]byte, 1+32+consts.Uint16Len)
	k[0] = npcPrefix
	copy(k[1:], npcID[:32]) // Use first 32 bytes of NPC ID hash
	binary.BigEndian.PutUint16(k[33:], NPCChunks)
	return k
}

// StarSystemKey creates a key for star system storage
// Format: [prefix][systemID hash][chunks]
func StarSystemKey(systemID []byte) []byte {
	k := make([]byte, 1+32+consts.Uint16Len)
	k[0] = starSystemPrefix
	copy(k[1:], systemID[:32])
	binary.BigEndian.PutUint16(k[33:], StarSystemChunks)
	return k
}

// PlanetKey creates a key for planet storage
// Format: [prefix][planetID hash][chunks]
func PlanetKey(planetID []byte) []byte {
	k := make([]byte, 1+32+consts.Uint16Len)
	k[0] = planetPrefix
	copy(k[1:], planetID[:32])
	binary.BigEndian.PutUint16(k[33:], PlanetChunks)
	return k
}

// CityKey creates a key for city storage
// Format: [prefix][cityName hash][chunks]
func CityKey(cityName []byte) []byte {
	k := make([]byte, 1+32+consts.Uint16Len)
	k[0] = cityPrefix
	copy(k[1:], cityName[:32])
	binary.BigEndian.PutUint16(k[33:], CityChunks)
	return k
}

// ValidatorKey creates a key for validator storage
// Format: [prefix][validatorID hash][chunks]
func ValidatorKey(validatorID []byte) []byte {
	k := make([]byte, 1+32+consts.Uint16Len)
	k[0] = validatorPrefix
	copy(k[1:], validatorID[:32])
	binary.BigEndian.PutUint16(k[33:], ValidatorChunks)
	return k
}

// TreasuryKey creates a key for treasury state
// Format: [prefix][tokenType][chunks]
func TreasuryKey(tokenType uint8) []byte {
	k := make([]byte, 1+1+consts.Uint16Len)
	k[0] = treasuryPrefix
	k[1] = tokenType
	binary.BigEndian.PutUint16(k[2:], TreasuryChunks)
	return k
}

// NPCOwnerKey creates an index key for NPCs by owner
// Format: [prefix][owner address][npc index]
func NPCOwnerKey(owner codec.Address, index uint32) []byte {
	k := make([]byte, 1+codec.AddressLen+4)
	k[0] = npcOwnerPrefix
	copy(k[1:], owner[:])
	binary.BigEndian.PutUint32(k[1+codec.AddressLen:], index)
	return k
}

// PlotOwnerKey creates an index key for plots by owner
// Format: [prefix][owner address][plot index]
func PlotOwnerKey(owner codec.Address, index uint32) []byte {
	k := make([]byte, 1+codec.AddressLen+4)
	k[0] = plotOwnerPrefix
	copy(k[1:], owner[:])
	binary.BigEndian.PutUint32(k[1+codec.AddressLen:], index)
	return k
}


