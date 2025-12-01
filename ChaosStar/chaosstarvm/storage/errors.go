// Copyright (C) 2024, ChaosStar Network. All rights reserved.

package storage

import "errors"

var (
	ErrInvalidBalance     = errors.New("invalid balance")
	ErrPlotAlreadyExists  = errors.New("plot already exists")
	ErrPlotNotFound       = errors.New("plot not found")
	ErrNotPlotOwner       = errors.New("not plot owner")
	ErrNPCAlreadyExists   = errors.New("NPC already exists")
	ErrNPCNotFound        = errors.New("NPC not found")
	ErrNotNPCOwner        = errors.New("not NPC owner")
	ErrStarSystemExists   = errors.New("star system already exists")
	ErrStarSystemNotFound = errors.New("star system not found")
	ErrPlanetExists       = errors.New("planet already exists")
	ErrPlanetNotFound     = errors.New("planet not found")
	ErrCityExists         = errors.New("city already exists")
	ErrCityNotFound       = errors.New("city not found")
	ErrLocationOccupied   = errors.New("location already occupied")
	ErrValidatorExists    = errors.New("validator already exists")
	ErrValidatorNotFound  = errors.New("validator not found")
	ErrInsufficientLiquidity = errors.New("insufficient treasury liquidity")
	ErrInvalidToken       = errors.New("invalid token type")
	ErrInvalidCoordinates = errors.New("invalid coordinates")
	ErrInvalidLevel       = errors.New("invalid level")
)


