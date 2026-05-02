// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// State management for ChaosStarVM

package storage

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"

	"github.com/ava-labs/avalanchego/database"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	smath "github.com/ava-labs/avalanchego/utils/math"
)

type ReadState func(context.Context, [][]byte) ([][]byte, []error)

// ============================================================================
// MULTI-TOKEN BALANCE MANAGEMENT
// ============================================================================

// GetBalance retrieves balance for a specific token type
func GetBalance(ctx context.Context, im state.Immutable, addr codec.Address, tokenType uint8) (uint64, error) {
	_, bal, _, err := getBalance(ctx, im, addr, tokenType)
	return bal, err
}

func getBalance(ctx context.Context, im state.Immutable, addr codec.Address, tokenType uint8) ([]byte, uint64, bool, error) {
	k := BalanceKey(addr, tokenType)
	bal, exists, err := innerGetBalance(im.GetValue(ctx, k))
	return k, bal, exists, err
}

func innerGetBalance(v []byte, err error) (uint64, bool, error) {
	if errors.Is(err, database.ErrNotFound) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	val, err := database.ParseUInt64(v)
	if err != nil {
		return 0, false, err
	}
	return val, true, nil
}

func SetBalance(ctx context.Context, mu state.Mutable, addr codec.Address, tokenType uint8, balance uint64) error {
	k := BalanceKey(addr, tokenType)
	return setBalance(ctx, mu, k, balance)
}

func setBalance(ctx context.Context, mu state.Mutable, key []byte, balance uint64) error {
	return mu.Insert(ctx, key, binary.BigEndian.AppendUint64(nil, balance))
}

func AddBalance(ctx context.Context, mu state.Mutable, addr codec.Address, tokenType uint8, amount uint64) (uint64, error) {
	key, bal, _, err := getBalance(ctx, mu, addr, tokenType)
	if err != nil {
		return 0, err
	}
	nbal, err := smath.Add(bal, amount)
	if err != nil {
		return 0, fmt.Errorf("%w: could not add balance (bal=%d, addr=%v, token=%d, amount=%d)",
			ErrInvalidBalance, bal, addr, tokenType, amount)
	}
	return nbal, setBalance(ctx, mu, key, nbal)
}

func SubBalance(ctx context.Context, mu state.Mutable, addr codec.Address, tokenType uint8, amount uint64) (uint64, error) {
	key, bal, ok, err := getBalance(ctx, mu, addr, tokenType)
	if !ok {
		return 0, fmt.Errorf("%w: could not subtract (bal=%d, addr=%v, token=%d, amount=%d)",
			ErrInvalidBalance, 0, addr, tokenType, amount)
	}
	if err != nil {
		return 0, err
	}
	nbal, err := smath.Sub(bal, amount)
	if err != nil {
		return 0, fmt.Errorf("%w: could not subtract balance (bal=%d < amount=%d, token=%d, addr=%v)",
			ErrInvalidBalance, bal, amount, tokenType, addr)
	}
	if nbal == 0 {
		return 0, mu.Remove(ctx, key)
	}
	return nbal, setBalance(ctx, mu, key, nbal)
}

// ============================================================================
// TREASURY MANAGEMENT
// ============================================================================

func GetTreasuryBalance(ctx context.Context, im state.Immutable, tokenType uint8) (uint64, error) {
	k := TreasuryKey(tokenType)
	bal, _, err := innerGetBalance(im.GetValue(ctx, k))
	return bal, err
}

func AddTreasuryBalance(ctx context.Context, mu state.Mutable, tokenType uint8, amount uint64) (uint64, error) {
	k := TreasuryKey(tokenType)
	v, err := mu.GetValue(ctx, k)
	var bal uint64
	if err != nil && !errors.Is(err, database.ErrNotFound) {
		return 0, err
	}
	if len(v) > 0 {
		bal, _ = database.ParseUInt64(v)
	}
	nbal, err := smath.Add(bal, amount)
	if err != nil {
		return 0, fmt.Errorf("%w: could not add treasury balance", ErrInvalidBalance)
	}
	return nbal, mu.Insert(ctx, k, binary.BigEndian.AppendUint64(nil, nbal))
}

func SubTreasuryBalance(ctx context.Context, mu state.Mutable, tokenType uint8, amount uint64) (uint64, error) {
	k := TreasuryKey(tokenType)
	v, err := mu.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return 0, ErrInsufficientLiquidity
	}
	if err != nil {
		return 0, err
	}
	bal, _ := database.ParseUInt64(v)
	nbal, err := smath.Sub(bal, amount)
	if err != nil {
		return 0, ErrInsufficientLiquidity
	}
	return nbal, mu.Insert(ctx, k, binary.BigEndian.AppendUint64(nil, nbal))
}

// ============================================================================
// PLOT MANAGEMENT
// ============================================================================

// Plot represents a land plot in the ChaosStar network
type Plot struct {
	Owner     codec.Address
	X         uint32
	Y         uint32
	Level     uint8
	Resources map[string]uint64 // Serialized separately
}

func PlotExists(ctx context.Context, im state.Immutable, x, y uint32) (bool, error) {
	k := PlotKey(x, y)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetPlot(ctx context.Context, im state.Immutable, x, y uint32) (*Plot, error) {
	k := PlotKey(x, y)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrPlotNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodePlot(v, x, y)
}

func SetPlot(ctx context.Context, mu state.Mutable, plot *Plot) error {
	k := PlotKey(plot.X, plot.Y)
	v := encodePlot(plot)
	return mu.Insert(ctx, k, v)
}

func encodePlot(p *Plot) []byte {
	// Simple encoding: [owner(33 bytes)][level(1 byte)]
	// Resources handled separately for now
	data := make([]byte, codec.AddressLen+1)
	copy(data[:codec.AddressLen], p.Owner[:])
	data[codec.AddressLen] = p.Level
	return data
}

func decodePlot(data []byte, x, y uint32) (*Plot, error) {
	if len(data) < codec.AddressLen+1 {
		return nil, fmt.Errorf("invalid plot data length")
	}
	var owner codec.Address
	copy(owner[:], data[:codec.AddressLen])
	return &Plot{
		Owner:     owner,
		X:         x,
		Y:         y,
		Level:     data[codec.AddressLen],
		Resources: make(map[string]uint64),
	}, nil
}

// ============================================================================
// NPC MANAGEMENT
// ============================================================================

// NPC represents a non-player character in the ChaosStar network
type NPC struct {
	ID           [32]byte
	Owner        codec.Address
	LocationX    uint32
	LocationY    uint32
	Loyalty      uint8
	AssignedTask []byte
}

func NPCExists(ctx context.Context, im state.Immutable, npcID []byte) (bool, error) {
	k := NPCKey(npcID)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetNPC(ctx context.Context, im state.Immutable, npcID []byte) (*NPC, error) {
	k := NPCKey(npcID)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrNPCNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodeNPC(v, npcID)
}

func SetNPC(ctx context.Context, mu state.Mutable, npc *NPC) error {
	k := NPCKey(npc.ID[:])
	v := encodeNPC(npc)
	return mu.Insert(ctx, k, v)
}

func encodeNPC(n *NPC) []byte {
	// [owner(33)][locationX(4)][locationY(4)][loyalty(1)][taskLen(2)][task...]
	taskLen := len(n.AssignedTask)
	data := make([]byte, codec.AddressLen+4+4+1+2+taskLen)
	copy(data[:codec.AddressLen], n.Owner[:])
	binary.BigEndian.PutUint32(data[codec.AddressLen:], n.LocationX)
	binary.BigEndian.PutUint32(data[codec.AddressLen+4:], n.LocationY)
	data[codec.AddressLen+8] = n.Loyalty
	binary.BigEndian.PutUint16(data[codec.AddressLen+9:], uint16(taskLen))
	copy(data[codec.AddressLen+11:], n.AssignedTask)
	return data
}

func decodeNPC(data []byte, npcID []byte) (*NPC, error) {
	if len(data) < codec.AddressLen+11 {
		return nil, fmt.Errorf("invalid NPC data length")
	}
	var owner codec.Address
	copy(owner[:], data[:codec.AddressLen])
	locX := binary.BigEndian.Uint32(data[codec.AddressLen:])
	locY := binary.BigEndian.Uint32(data[codec.AddressLen+4:])
	loyalty := data[codec.AddressLen+8]
	taskLen := binary.BigEndian.Uint16(data[codec.AddressLen+9:])
	var task []byte
	if taskLen > 0 && len(data) >= codec.AddressLen+11+int(taskLen) {
		task = make([]byte, taskLen)
		copy(task, data[codec.AddressLen+11:])
	}
	var id [32]byte
	copy(id[:], npcID[:32])
	return &NPC{
		ID:           id,
		Owner:        owner,
		LocationX:    locX,
		LocationY:    locY,
		Loyalty:      loyalty,
		AssignedTask: task,
	}, nil
}

// ============================================================================
// STAR SYSTEM MANAGEMENT
// ============================================================================

// StarSystem represents a star system (subnet) in the ChaosStar network
type StarSystem struct {
	ID         [32]byte
	Name       []byte
	Owner      codec.Address
	SubnetID   []byte
	SubnetName []byte
	RPCURL     []byte
	ChainID    uint64
	Status     uint8
	CreatedAt  uint64
}

func StarSystemExists(ctx context.Context, im state.Immutable, systemID []byte) (bool, error) {
	k := StarSystemKey(systemID)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetStarSystem(ctx context.Context, im state.Immutable, systemID []byte) (*StarSystem, error) {
	k := StarSystemKey(systemID)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrStarSystemNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodeStarSystem(v, systemID)
}

func SetStarSystem(ctx context.Context, mu state.Mutable, system *StarSystem) error {
	k := StarSystemKey(system.ID[:])
	v := encodeStarSystem(system)
	return mu.Insert(ctx, k, v)
}

func encodeStarSystem(s *StarSystem) []byte {
	// Simplified encoding
	size := codec.AddressLen + 8 + 1 + 8 + 2 + len(s.Name) + 2 + len(s.SubnetID) + 2 + len(s.RPCURL)
	data := make([]byte, size)
	offset := 0
	copy(data[offset:], s.Owner[:])
	offset += codec.AddressLen
	binary.BigEndian.PutUint64(data[offset:], s.ChainID)
	offset += 8
	data[offset] = s.Status
	offset++
	binary.BigEndian.PutUint64(data[offset:], s.CreatedAt)
	offset += 8
	// Name
	binary.BigEndian.PutUint16(data[offset:], uint16(len(s.Name)))
	offset += 2
	copy(data[offset:], s.Name)
	offset += len(s.Name)
	// SubnetID
	binary.BigEndian.PutUint16(data[offset:], uint16(len(s.SubnetID)))
	offset += 2
	copy(data[offset:], s.SubnetID)
	offset += len(s.SubnetID)
	// RPCURL
	binary.BigEndian.PutUint16(data[offset:], uint16(len(s.RPCURL)))
	offset += 2
	copy(data[offset:], s.RPCURL)
	return data
}

func decodeStarSystem(data []byte, systemID []byte) (*StarSystem, error) {
	if len(data) < codec.AddressLen+17 {
		return nil, fmt.Errorf("invalid star system data length")
	}
	var owner codec.Address
	copy(owner[:], data[:codec.AddressLen])
	offset := codec.AddressLen
	chainID := binary.BigEndian.Uint64(data[offset:])
	offset += 8
	status := data[offset]
	offset++
	createdAt := binary.BigEndian.Uint64(data[offset:])
	offset += 8

	nameLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	name := make([]byte, nameLen)
	copy(name, data[offset:offset+int(nameLen)])
	offset += int(nameLen)

	subnetLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	subnetID := make([]byte, subnetLen)
	copy(subnetID, data[offset:offset+int(subnetLen)])
	offset += int(subnetLen)

	rpcLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	rpcURL := make([]byte, rpcLen)
	if offset+int(rpcLen) <= len(data) {
		copy(rpcURL, data[offset:offset+int(rpcLen)])
	}

	var id [32]byte
	copy(id[:], systemID[:32])
	return &StarSystem{
		ID:         id,
		Name:       name,
		Owner:      owner,
		SubnetID:   subnetID,
		RPCURL:     rpcURL,
		ChainID:    chainID,
		Status:     status,
		CreatedAt:  createdAt,
	}, nil
}

// ============================================================================
// PLANET MANAGEMENT
// ============================================================================

// Planet represents a planet (validator) in a star system
type Planet struct {
	ID           [32]byte
	Name         []byte
	Owner        codec.Address
	StarSystemID []byte
	NodeID       []byte
	NodeAddress  []byte
	PlanetType   uint8
	Active       bool
	CreatedAt    uint64
}

func PlanetExists(ctx context.Context, im state.Immutable, planetID []byte) (bool, error) {
	k := PlanetKey(planetID)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetPlanet(ctx context.Context, im state.Immutable, planetID []byte) (*Planet, error) {
	k := PlanetKey(planetID)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrPlanetNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodePlanet(v, planetID)
}

func SetPlanet(ctx context.Context, mu state.Mutable, planet *Planet) error {
	k := PlanetKey(planet.ID[:])
	v := encodePlanet(planet)
	return mu.Insert(ctx, k, v)
}

func encodePlanet(p *Planet) []byte {
	size := codec.AddressLen + 1 + 1 + 8 + 2 + len(p.Name) + 2 + len(p.StarSystemID) + 2 + len(p.NodeID) + 2 + len(p.NodeAddress)
	data := make([]byte, size)
	offset := 0
	copy(data[offset:], p.Owner[:])
	offset += codec.AddressLen
	data[offset] = p.PlanetType
	offset++
	if p.Active {
		data[offset] = 1
	}
	offset++
	binary.BigEndian.PutUint64(data[offset:], p.CreatedAt)
	offset += 8
	// Name
	binary.BigEndian.PutUint16(data[offset:], uint16(len(p.Name)))
	offset += 2
	copy(data[offset:], p.Name)
	offset += len(p.Name)
	// StarSystemID
	binary.BigEndian.PutUint16(data[offset:], uint16(len(p.StarSystemID)))
	offset += 2
	copy(data[offset:], p.StarSystemID)
	offset += len(p.StarSystemID)
	// NodeID
	binary.BigEndian.PutUint16(data[offset:], uint16(len(p.NodeID)))
	offset += 2
	copy(data[offset:], p.NodeID)
	offset += len(p.NodeID)
	// NodeAddress
	binary.BigEndian.PutUint16(data[offset:], uint16(len(p.NodeAddress)))
	offset += 2
	copy(data[offset:], p.NodeAddress)
	return data
}

func decodePlanet(data []byte, planetID []byte) (*Planet, error) {
	if len(data) < codec.AddressLen+10 {
		return nil, fmt.Errorf("invalid planet data length")
	}
	var owner codec.Address
	copy(owner[:], data[:codec.AddressLen])
	offset := codec.AddressLen
	planetType := data[offset]
	offset++
	active := data[offset] == 1
	offset++
	createdAt := binary.BigEndian.Uint64(data[offset:])
	offset += 8

	nameLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	name := make([]byte, nameLen)
	copy(name, data[offset:offset+int(nameLen)])
	offset += int(nameLen)

	systemLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	systemID := make([]byte, systemLen)
	copy(systemID, data[offset:offset+int(systemLen)])
	offset += int(systemLen)

	nodeIDLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	nodeID := make([]byte, nodeIDLen)
	copy(nodeID, data[offset:offset+int(nodeIDLen)])
	offset += int(nodeIDLen)

	nodeAddrLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	nodeAddr := make([]byte, nodeAddrLen)
	if offset+int(nodeAddrLen) <= len(data) {
		copy(nodeAddr, data[offset:offset+int(nodeAddrLen)])
	}

	var id [32]byte
	copy(id[:], planetID[:32])
	return &Planet{
		ID:           id,
		Name:         name,
		Owner:        owner,
		StarSystemID: systemID,
		NodeID:       nodeID,
		NodeAddress:  nodeAddr,
		PlanetType:   planetType,
		Active:       active,
		CreatedAt:    createdAt,
	}, nil
}

// ============================================================================
// CITY MANAGEMENT
// ============================================================================

// City represents a city in the ChaosStar network
type City struct {
	Name       []byte
	Owner      codec.Address
	LocationX  uint32
	LocationY  uint32
	Population uint64
	TaxRate    uint8
	Treasury   uint64
	CreatedAt  uint64
}

func CityExists(ctx context.Context, im state.Immutable, cityName []byte) (bool, error) {
	k := CityKey(cityName)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetCity(ctx context.Context, im state.Immutable, cityName []byte) (*City, error) {
	k := CityKey(cityName)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrCityNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodeCity(v, cityName)
}

func SetCity(ctx context.Context, mu state.Mutable, city *City) error {
	k := CityKey(city.Name)
	v := encodeCity(city)
	return mu.Insert(ctx, k, v)
}

func encodeCity(c *City) []byte {
	data := make([]byte, codec.AddressLen+4+4+8+1+8+8)
	copy(data[:codec.AddressLen], c.Owner[:])
	offset := codec.AddressLen
	binary.BigEndian.PutUint32(data[offset:], c.LocationX)
	offset += 4
	binary.BigEndian.PutUint32(data[offset:], c.LocationY)
	offset += 4
	binary.BigEndian.PutUint64(data[offset:], c.Population)
	offset += 8
	data[offset] = c.TaxRate
	offset++
	binary.BigEndian.PutUint64(data[offset:], c.Treasury)
	offset += 8
	binary.BigEndian.PutUint64(data[offset:], c.CreatedAt)
	return data
}

func decodeCity(data []byte, cityName []byte) (*City, error) {
	if len(data) < codec.AddressLen+33 {
		return nil, fmt.Errorf("invalid city data length")
	}
	var owner codec.Address
	copy(owner[:], data[:codec.AddressLen])
	offset := codec.AddressLen
	locX := binary.BigEndian.Uint32(data[offset:])
	offset += 4
	locY := binary.BigEndian.Uint32(data[offset:])
	offset += 4
	pop := binary.BigEndian.Uint64(data[offset:])
	offset += 8
	taxRate := data[offset]
	offset++
	treasury := binary.BigEndian.Uint64(data[offset:])
	offset += 8
	createdAt := binary.BigEndian.Uint64(data[offset:])

	return &City{
		Name:       cityName,
		Owner:      owner,
		LocationX:  locX,
		LocationY:  locY,
		Population: pop,
		TaxRate:    taxRate,
		Treasury:   treasury,
		CreatedAt:  createdAt,
	}, nil
}

// ============================================================================
// VALIDATOR MANAGEMENT
// ============================================================================

// Validator represents a registered validator in the network
type Validator struct {
	ID            [32]byte
	Name          []byte
	NativeToken   uint8
	StakingAmount uint64
	XBGLRewards   uint64
	Active        bool
}

func ValidatorExists(ctx context.Context, im state.Immutable, validatorID []byte) (bool, error) {
	k := ValidatorKey(validatorID)
	_, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetValidator(ctx context.Context, im state.Immutable, validatorID []byte) (*Validator, error) {
	k := ValidatorKey(validatorID)
	v, err := im.GetValue(ctx, k)
	if errors.Is(err, database.ErrNotFound) {
		return nil, ErrValidatorNotFound
	}
	if err != nil {
		return nil, err
	}
	return decodeValidator(v, validatorID)
}

func SetValidator(ctx context.Context, mu state.Mutable, validator *Validator) error {
	k := ValidatorKey(validator.ID[:])
	v := encodeValidator(validator)
	return mu.Insert(ctx, k, v)
}

func encodeValidator(v *Validator) []byte {
	size := 1 + 8 + 8 + 1 + 2 + len(v.Name)
	data := make([]byte, size)
	offset := 0
	data[offset] = v.NativeToken
	offset++
	binary.BigEndian.PutUint64(data[offset:], v.StakingAmount)
	offset += 8
	binary.BigEndian.PutUint64(data[offset:], v.XBGLRewards)
	offset += 8
	if v.Active {
		data[offset] = 1
	}
	offset++
	binary.BigEndian.PutUint16(data[offset:], uint16(len(v.Name)))
	offset += 2
	copy(data[offset:], v.Name)
	return data
}

func decodeValidator(data []byte, validatorID []byte) (*Validator, error) {
	if len(data) < 19 {
		return nil, fmt.Errorf("invalid validator data length")
	}
	offset := 0
	nativeToken := data[offset]
	offset++
	stakingAmount := binary.BigEndian.Uint64(data[offset:])
	offset += 8
	xbglRewards := binary.BigEndian.Uint64(data[offset:])
	offset += 8
	active := data[offset] == 1
	offset++
	nameLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2
	name := make([]byte, nameLen)
	if offset+int(nameLen) <= len(data) {
		copy(name, data[offset:])
	}

	var id [32]byte
	copy(id[:], validatorID[:32])
	return &Validator{
		ID:            id,
		Name:          name,
		NativeToken:   nativeToken,
		StakingAmount: stakingAmount,
		XBGLRewards:   xbglRewards,
		Active:        active,
	}, nil
}


