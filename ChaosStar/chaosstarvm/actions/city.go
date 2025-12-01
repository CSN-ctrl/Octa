// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// City actions - create and manage cities

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
	CityComputeUnits  = 6
	MaxCityNameLength = 64
)

var (
	ErrCityExists      = errors.New("city already exists")
	ErrCityNotFound    = errors.New("city not found")
	ErrInvalidCityName = errors.New("invalid city name")
	ErrNotCityOwner    = errors.New("not city owner")
	ErrInvalidTaxRate  = errors.New("tax rate must be 0-100")
)

func hashCityName(cityName []byte) []byte {
	h := sha256.Sum256(cityName)
	return h[:]
}

// ============================================================================
// CITY CREATE
// ============================================================================

var _ chain.Action = (*CityCreate)(nil)

type CityCreate struct {
	Name      []byte `serialize:"true" json:"name"`
	LocationX uint32 `serialize:"true" json:"location_x"`
	LocationY uint32 `serialize:"true" json:"location_y"`
}

func (*CityCreate) GetTypeID() uint8 { return consts.CityCreateID }

func (c *CityCreate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	cityNameHash := hashCityName(c.Name)
	return state.Keys{string(storage.CityKey(cityNameHash)): state.All}
}

func (c *CityCreate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if len(c.Name) == 0 || len(c.Name) > MaxCityNameLength {
		return nil, ErrInvalidCityName
	}
	cityNameHash := hashCityName(c.Name)
	exists, err := storage.CityExists(ctx, mu, cityNameHash)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCityExists
	}
	city := &storage.City{
		Name: c.Name, Owner: actor, LocationX: c.LocationX, LocationY: c.LocationY,
		Population: 0, TaxRate: 5, Treasury: 0, CreatedAt: uint64(time.Now().Unix()),
	}
	if err := storage.SetCity(ctx, mu, city); err != nil {
		return nil, err
	}
	result := &CityCreateResult{Name: c.Name, Owner: actor, LocationX: c.LocationX, LocationY: c.LocationY}
	return result.Bytes(), nil
}

func (*CityCreate) ComputeUnits(chain.Rules) uint64   { return CityComputeUnits }
func (*CityCreate) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (c *CityCreate) Bytes() []byte                    { return MarshalAction(consts.CityCreateID, c) }

type CityCreateResult struct {
	Name      []byte        `serialize:"true" json:"name"`
	Owner     codec.Address `serialize:"true" json:"owner"`
	LocationX uint32        `serialize:"true" json:"location_x"`
	LocationY uint32        `serialize:"true" json:"location_y"`
}

func (*CityCreateResult) GetTypeID() uint8 { return consts.CityCreateID }
func (r *CityCreateResult) Bytes() []byte  { return MarshalAction(consts.CityCreateID, r) }

// ============================================================================
// CITY UPDATE ECONOMY
// ============================================================================

var _ chain.Action = (*CityUpdateEconomy)(nil)

type CityUpdateEconomy struct {
	CityName []byte `serialize:"true" json:"city_name"`
	TaxRate  uint8  `serialize:"true" json:"tax_rate"`
}

func (*CityUpdateEconomy) GetTypeID() uint8 { return consts.CityUpdateEconomyID }

func (c *CityUpdateEconomy) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	cityNameHash := hashCityName(c.CityName)
	return state.Keys{string(storage.CityKey(cityNameHash)): state.Read | state.Write}
}

func (c *CityUpdateEconomy) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if c.TaxRate > 100 {
		return nil, ErrInvalidTaxRate
	}
	cityNameHash := hashCityName(c.CityName)
	city, err := storage.GetCity(ctx, mu, cityNameHash)
	if err != nil {
		return nil, ErrCityNotFound
	}
	if city.Owner != actor {
		return nil, ErrNotCityOwner
	}
	city.TaxRate = c.TaxRate
	if err := storage.SetCity(ctx, mu, city); err != nil {
		return nil, err
	}
	result := &CityUpdateEconomyResult{CityName: c.CityName, NewTaxRate: c.TaxRate}
	return result.Bytes(), nil
}

func (*CityUpdateEconomy) ComputeUnits(chain.Rules) uint64   { return CityComputeUnits }
func (*CityUpdateEconomy) ValidRange(chain.Rules) (int64, int64) { return -1, -1 }
func (c *CityUpdateEconomy) Bytes() []byte                    { return MarshalAction(consts.CityUpdateEconomyID, c) }

type CityUpdateEconomyResult struct {
	CityName   []byte `serialize:"true" json:"city_name"`
	NewTaxRate uint8  `serialize:"true" json:"new_tax_rate"`
}

func (*CityUpdateEconomyResult) GetTypeID() uint8 { return consts.CityUpdateEconomyID }
func (r *CityUpdateEconomyResult) Bytes() []byte  { return MarshalAction(consts.CityUpdateEconomyID, r) }
