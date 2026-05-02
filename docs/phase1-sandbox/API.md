# Phase 1 API Reference

## Overview

This document provides a complete API reference for all Phase 1 contracts. Functions are organized by contract with descriptions, parameters, return values, and events.

## Contract Index

1. [SaraktLandV2V1](#1-saraktlandv2v1)
2. [PlotRegistry1155V1](#2-plotregistry1155v1)
3. [PlanetPlotLimiterV1](#3-planetplotlimiterv1)
4. [BuildingRegistryV1](#4-buildingregistryv1)
5. [ResidentialBuildingV1](#5-residentialbuildingv1)
6. [WorkshopBuildingV1](#6-workshopbuildingv1)
7. [NPCMigrationSystemV1](#7-npcmigrationsystemv1)
8. [CityTreasuryV1](#8-citytreasuryv1)
9. [PlanetTreasuryV1](#9-planettreasuryv1)
10. [StarSystemTreasuryV1](#10-starsystemtreasuryv1)

---

## 1. SaraktLandV2V1

### Initialization

```solidity
function initialize(
    address _owner,
    address _treasury,
    address _digitalID,
    string memory _defaultURI,
    uint256 _plotPriceEUR,
    uint256 _initialEurXbglRate,
    uint256 _initialEurUsdcRate,
    address _swapRouter,
    address _exchangeRateOracle
) public initializer
```

### Purchase Functions

#### buyPlotWithAVAX
```solidity
function buyPlotWithAVAX(uint256 plotId) external payable
```
Purchase plot with native xBGL token.

**Parameters:**
- `plotId` (uint256): Plot ID to purchase

**Requirements:**
- Sales must be active
- Plot must not be sold
- Digital ID may be required
- Correct amount must be sent

#### buyPlotWithUSDC
```solidity
function buyPlotWithUSDC(uint256 plotId, uint256 maxUsdcAmount) external
```
Purchase plot with USDC (auto-swaps to xBGL).

**Parameters:**
- `plotId` (uint256): Plot ID to purchase
- `maxUsdcAmount` (uint256): Maximum USDC amount to pay

**Requirements:**
- Sales must be active
- Plot must not be sold
- USDC must be approved
- Amount must cover price

### Price Functions

#### getPlotPriceXBGL
```solidity
function getPlotPriceXBGL() public view returns (uint256)
```
Get current plot price in xBGL.

**Returns:** Price in xBGL (wei)

#### getPlotPriceUSDC
```solidity
function getPlotPriceUSDC() public view returns (uint256)
```
Get current plot price in USDC.

**Returns:** Price in USDC (6 decimals)

#### getExchangeRates
```solidity
function getExchangeRates() public view returns (
    uint256 eurXbglRate,
    uint256 eurUsdcRate,
    uint256 plotPriceXBGL,
    uint256 plotPriceUSDC
)
```
Get all exchange rates and calculated prices.

### Admin Functions

#### setPlotPriceEUR
```solidity
function setPlotPriceEUR(uint256 newPriceEUR) external onlyOwner
```
Set plot price in EUR (adjustable).

**Parameters:**
- `newPriceEUR` (uint256): New price in EUR (with 2 decimals, e.g., 10000 = 100.00 EUR)

#### updateEurXbglRate
```solidity
function updateEurXbglRate(uint256 newRate) external onlyOwner
```
Update EUR/xBGL exchange rate.

**Parameters:**
- `newRate` (uint256): New rate (6 decimals, e.g., 1955833 = 1.955833)

#### updateEurUsdcRate
```solidity
function updateEurUsdcRate(uint256 newRate) external onlyOwner
```
Update EUR/USDC exchange rate.

**Parameters:**
- `newRate` (uint256): New rate (4 decimals or match USDC decimals)

### View Functions

```solidity
function plotPriceEUR() external view returns (uint256)
function eurXbglExchangeRate() external view returns (uint256)
function eurUsdcExchangeRate() external view returns (uint256)
function plotsSold() external view returns (uint256)
function salesActive() external view returns (bool)
function requireDigitalID() external view returns (bool)
function treasury() external view returns (address)
function digitalID() external view returns (address)
```

### Events

```solidity
event LandMinted(uint256 indexed plotId, address indexed owner, uint256 pricePaid, bool isAVAX, uint256 timestamp);
event PlotPriceEURUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
event ExchangeRateUpdated(uint8 rateType, uint256 oldRate, uint256 newRate, uint256 timestamp);
```

---

## 2. PlotRegistry1155V1

### Initialization

```solidity
function initialize(address _admin, address _plotLimiter) public initializer
```

### Plot Management

#### activate
```solidity
function activate(
    uint256 plotId,
    address to,
    string memory metadataURI,
    address planetAddress,
    uint8 zone
) external onlyRole(MINTER_ROLE)
```
Activate and mint a plot.

**Parameters:**
- `plotId` (uint256): Plot ID
- `to` (address): Recipient address
- `metadataURI` (string): Metadata URI
- `planetAddress` (address): Planet address
- `zone` (uint8): Zone number

**Requirements:**
- Plot must not be activated
- Plot limit must not be reached
- Valid zone and plot type

### View Functions

```solidity
function activated(uint256 plotId) external view returns (bool)
function getPlotInfo(uint256 plotId) external view returns (
    bool isActivated,
    string memory uri,
    address planet,
    uint8 zone
)
```

### Events

```solidity
event PlotActivated(uint256 indexed plotId, address indexed owner, string metadataURI, address planet, uint8 zone);
```

---

## 3. PlanetPlotLimiterV1

### Initialization

```solidity
function initialize(
    address _owner,
    uint256 _defaultResidentialSize,
    uint256 _defaultCommercialSize,
    uint256 _defaultWorkshopSize
) public initializer
```

### Configuration

#### setPlanetSize
```solidity
function setPlanetSize(
    address planetAddress,
    uint256 sizeSquareMeters,
    uint256 plotSizeResidential,
    uint256 plotSizeCommercial,
    uint256 plotSizeWorkshop
) external onlyOwner
```
Set planet size and plot sizes.

**Parameters:**
- `planetAddress` (address): Planet contract address
- `sizeSquareMeters` (uint256): Planet size in square meters
- `plotSizeResidential` (uint256): Residential plot size (m²)
- `plotSizeCommercial` (uint256): Commercial plot size (m²)
- `plotSizeWorkshop` (uint256): Workshop plot size (m²)

#### setZoneLimit
```solidity
function setZoneLimit(address planetAddress, uint8 zone, uint256 limit) external onlyOwner
```
Set zone plot limit (e.g., Octavia Capital City zones 1-3: 10,000 plots).

### Validation

#### canIssuePlot
```solidity
function canIssuePlot(address planetAddress, uint8 zone, uint8 plotType) external view returns (bool)
```
Check if plot can be issued.

**Returns:** True if plot can be issued

#### getMaxPlots
```solidity
function getMaxPlots(address planetAddress, uint8 plotType) external view returns (uint256)
```
Get maximum plots for a planet and type.

### View Functions

```solidity
function getRemainingPlots(address planetAddress, uint8 zone, uint8 plotType) external view returns (uint256)
function getIssuedPlots(address planetAddress, uint8 zone, uint8 plotType) external view returns (uint256)
```

### Events

```solidity
event PlanetSizeSet(address indexed planet, uint256 sizeSquareMeters);
event PlotLimitReached(address indexed planet, uint8 zone, uint8 plotType);
```

---

## 4. BuildingRegistryV1

### Initialization

```solidity
function initialize(address _owner, address _plotRegistry) public initializer
```

### Building Management

#### buildBuilding
```solidity
function buildBuilding(
    uint256 plotId,
    BuildingType buildingType,
    BuildingStage stage,
    string memory metadataURI
) external
```
Build a building on a plot.

**Parameters:**
- `plotId` (uint256): Plot ID
- `buildingType` (BuildingType): Residential, Workshop, or Commercial
- `stage` (BuildingStage): Building stage (Tribal for Phase 1)
- `metadataURI` (string): Building metadata URI

**Requirements:**
- Caller must own plot
- Zone restrictions must be met
- Plot type must match building type

### View Functions

```solidity
function getBuilding(uint256 plotId) external view returns (Building memory)
function validateBuildingAllowed(uint256 plotId, BuildingType buildingType) external view returns (bool)
```

### Events

```solidity
event BuildingConstructed(uint256 indexed plotId, address indexed owner, BuildingType buildingType, BuildingStage stage);
```

---

## 5. ResidentialBuildingV1

### Initialization

```solidity
function initialize(
    address _owner,
    address _buildingRegistry,
    address _migrationSystem
) public initializer
```

### Rental Management

#### createRentalListing
```solidity
function createRentalListing(uint256 plotId, uint256 monthlyRent) external
```
Create a rental listing.

**Parameters:**
- `plotId` (uint256): Plot with residential building
- `monthlyRent` (uint256): Monthly rent in xBGL (wei)

#### assignTenant
```solidity
function assignTenant(uint256 plotId, address tenant) external onlyMigrationSystem
```
Assign a tenant (called by migration system).

**Parameters:**
- `plotId` (uint256): Plot ID
- `tenant` (address): NPC tenant address

### View Functions

```solidity
function getAvailableRentals(address cityAddress) external view returns (RentalListing[] memory)
function getRentalListing(uint256 plotId) external view returns (RentalListing memory)
```

### Events

```solidity
event RentalListed(uint256 indexed plotId, address indexed owner, uint256 monthlyRent);
event TenantAssigned(uint256 indexed plotId, address indexed tenant);
```

---

## 6. WorkshopBuildingV1

### Initialization

```solidity
function initialize(
    address _owner,
    address _buildingRegistry,
    address _migrationSystem
) public initializer
```

### Job Management

#### createJobPosting
```solidity
function createJobPosting(uint256 plotId, uint256 wage, uint256 positions) external
```
Create a job posting.

**Parameters:**
- `plotId` (uint256): Plot with workshop building
- `wage` (uint256): Monthly wage in xBGL (wei)
- `positions` (uint256): Number of positions

#### hireEmployee
```solidity
function hireEmployee(uint256 plotId, address employee) external onlyMigrationSystem
```
Hire an employee (called by migration system).

### View Functions

```solidity
function getAvailableJobs(address cityAddress) external view returns (JobPosting[] memory)
function getJobPosting(uint256 plotId) external view returns (JobPosting memory)
```

### Events

```solidity
event JobPosted(uint256 indexed plotId, address indexed owner, uint256 wage, uint256 positions);
event EmployeeHired(uint256 indexed plotId, address indexed employee);
```

---

## 7. NPCMigrationSystemV1

### Initialization

```solidity
function initialize(
    address _owner,
    address _residentialBuilding,
    address _workshopBuilding,
    address _cityContract,
    uint256 _migrationCooldown
) public initializer
```

### Migration

#### migrateNPC
```solidity
function migrateNPC(address npcAddress, address cityAddress) external
```
Migrate an NPC to a city (requires job and housing).

**Parameters:**
- `npcAddress` (address): NPC address
- `cityAddress` (address): City address

**Requirements:**
- Available job must exist
- Available housing must exist
- Cooldown must have passed

#### findMigrationOpportunities
```solidity
function findMigrationOpportunities(address cityAddress) external view returns (
    uint256 jobsAvailable,
    uint256 housingAvailable
)
```
Find available migration opportunities in a city.

### Events

```solidity
event NPCMigrated(
    address indexed npc,
    address indexed city,
    uint256 plotIdJob,
    uint256 plotIdHousing,
    uint256 timestamp
);
```

---

## 8. CityTreasuryV1

### Initialization

```solidity
function initialize(
    address _owner,
    address _cityContract,
    address _planetTreasury,
    uint256 _tributePercentage
) public initializer
```

### Deposits

```solidity
function deposit() external payable
function depositToken(address token, uint256 amount) external
```

### Withdrawals

```solidity
function withdraw(uint256 amount) external onlyOwner
function withdrawToken(address token, uint256 amount) external onlyOwner
```

### Tribute

```solidity
function payTribute() external onlyOwner
```

### Events

```solidity
event Deposit(address indexed from, address indexed token, uint256 amount);
event Withdrawal(address indexed to, address indexed token, uint256 amount);
event TributePaid(address indexed planetTreasury, uint256 amount);
```

---

## 9. PlanetTreasuryV1

### Initialization

```solidity
function initialize(
    address _owner,
    address _planetContract,
    address _starSystemTreasury,
    uint256 _tributePercentage
) public initializer
```

### Tribute Receipt

```solidity
function receiveTribute(address cityTreasury, uint256 amount) external payable
function receiveTributeToken(address cityTreasury, address token, uint256 amount) external
```

### Events

```solidity
event TributeReceived(address indexed cityTreasury, uint256 amount);
event TributePaid(address indexed starSystemTreasury, uint256 amount);
```

---

## 10. StarSystemTreasuryV1

### Initialization

```solidity
function initialize(address _owner, address _starSystemContract) public initializer
```

### Tribute Receipt

```solidity
function receiveTribute(address planetTreasury, uint256 amount) external payable
function receiveTributeToken(address planetTreasury, address token, uint256 amount) external
```

### Events

```solidity
event TributeReceived(address indexed planetTreasury, uint256 amount);
```

---

## Common Patterns

### Error Handling

All functions use standard Solidity error handling:
- `require()` for input validation
- `revert()` for custom errors
- Return values for view functions

### Access Control

- `onlyOwner`: Admin/multisig only
- `onlyRole(ROLE)`: Specific role required
- `onlyMigrationSystem`: Migration system only

### Events

All state-changing functions emit events for:
- Indexed parameters for filtering
- All relevant data for indexing
- Timestamps where applicable

