// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Action Type IDs for ChaosStarVM

package consts

const (
	// Basic Transfer Actions
	TransferID uint8 = iota // 0

	// Plot Actions
	PlotPurchaseID  // 1
	PlotUpgradeID   // 2
	PlotTransferID  // 3
	PlotAddResourceID // 4

	// NPC Actions
	NPCCreateID   // 5
	NPCTrainID    // 6
	NPCAssignID   // 7
	NPCRelocateID // 8
	NPCUpdateLoyaltyID // 9

	// Star System Actions
	StarSystemCreateID // 10
	StarSystemUpdateID // 11
	StarSystemAddPlanetID // 12

	// Planet Actions
	PlanetCreateID // 13
	PlanetUpdateID // 14

	// City Actions
	CityCreateID        // 15
	CityAddPlotID       // 16
	CityAddInfrastructureID // 17
	CityUpdateEconomyID // 18

	// Treasury Actions
	TokenSwapID           // 19
	CrossValidatorSwapID  // 20
	ValidatorRewardID     // 21
	ValidatorRegisterID   // 22
	TreasuryDepositID     // 23

	// Token Types
	TokenXBGL  uint8 = 0
	TokenChaos uint8 = 1
	TokenXen   uint8 = 2

	// Planet Types
	PlanetHabitable uint8 = 0
	PlanetResource  uint8 = 1
	PlanetResearch  uint8 = 2
	PlanetMilitary  uint8 = 3

	// System Status
	SystemActive    uint8 = 0
	SystemDeploying uint8 = 1
	SystemInactive  uint8 = 2
)

// Max sizes for validation
const (
	MaxNameSize        = 64
	MaxMemoSize        = 256
	MaxMetadataSize    = 1024
	MaxCoordinate      = 1000000 // Max grid coordinate
	MaxLevel           = 100     // Max upgrade level
	MaxLoyalty         = 100     // Max NPC loyalty
	MaxTaxRate         = 100     // Max tax rate percentage
	MaxSkillExperience = 1000000 // Max experience per skill
)


