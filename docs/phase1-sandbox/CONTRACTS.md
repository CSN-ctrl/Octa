# Phase 1 Contract Specifications

## Overview

All Phase 1 contracts are upgradeable using the UUPS (Universal Upgradeable Proxy Standard) proxy pattern. Contracts use OpenZeppelin's upgradeable contracts library for security and upgradeability.

## Contract List

### Core Contracts (5)
1. SaraktLandV2V1
2. PlotRegistry1155V1
3. SaraktDigitalIDV1
4. SaraktTreasuryV1
5. AccountRegistryV1

### New Phase 1 Contracts (5)
6. PlanetPlotLimiterV1
7. BuildingRegistryV1
8. ResidentialBuildingV1
9. WorkshopBuildingV1
10. NPCMigrationSystemV1

### Treasury Contracts (3 New)
11. CityTreasuryV1
12. PlanetTreasuryV1
13. StarSystemTreasuryV1

### Supporting Contracts (3)
14. City Contract
15. Planet Contract
16. StarSystem Contract

---

## 1. SaraktLandV2V1

### Purpose
ERC-1155 land plot sales contract with EUR-based pricing, USDC payment, and automatic swap to xBGL.

### Key Features
- Plot purchase with AVAX (native xBGL) or USDC
- EUR-based pricing (adjustable by admin)
- Automatic USDC to xBGL swap
- Payment routing (33% to reserve treasury, 67% to operational treasury)
- Digital ID requirement toggle

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base slots (0-3)

address public treasury;                    // Slot 4
address public digitalID;                   // Slot 5
uint256 public plotsSold;                   // Slot 6
uint256 public plotPriceEUR;                // Slot 7: Adjustable, initial 10000 (100.00 EUR)
uint256 public eurXbglExchangeRate;         // Slot 8: Variable, initial 1955833 (1.955833)
uint256 public eurUsdcExchangeRate;         // Slot 9: Variable, market rate
address public swapRouter;                  // Slot 10: DEX router for swaps
address public exchangeRateOracle;          // Slot 11: Oracle for rates
bool public salesActive;                    // Slot 12
bool public requireDigitalID;               // Slot 13
uint256 public slippageTolerance;           // Slot 14: Basis points
mapping(uint256 => bool) public plotMinted; // Slot 15
string public defaultURI;                   // Slot 16

uint256[34] private __gap;                  // Slots 17-50
```

### Key Functions
- `initialize(address owner, address treasury, address digitalID, uint256 plotPriceEUR, ...)`
- `buyPlotWithAVAX(uint256 plotId)`
- `buyPlotWithUSDC(uint256 plotId, uint256 maxUsdcAmount)`
- `getPlotPriceXBGL() view returns (uint256)`
- `getPlotPriceUSDC() view returns (uint256)`
- `setPlotPriceEUR(uint256 newPriceEUR) onlyOwner`
- `updateEurXbglRate(uint256 newRate) onlyOwner`
- `updateEurUsdcRate(uint256 newRate) onlyOwner`

### Events
- `LandMinted(uint256 indexed plotId, address indexed owner, uint256 pricePaid, bool isAVAX, uint256 timestamp)`
- `PlotPriceEURUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp)`
- `ExchangeRateUpdated(uint8 rateType, uint256 oldRate, uint256 newRate, uint256 timestamp)`

---

## 2. PlotRegistry1155V1

### Purpose
ERC-1155 plot registry with admin-approved transfers and zone-based plot limits.

### Key Features
- Plot activation by admin/minter
- Zone-based plot limits (Octavia Capital City zones 1-3: 10,000 plots)
- Plot type validation (Residential, Commercial, Workshop)
- Admin-approved transfers
- Metadata URI storage

### Storage Layout
```solidity
// ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable base slots

address public plotLimiter;                 // PlanetPlotLimiter contract
mapping(uint256 => bool) public activated;  // Plot activation status
mapping(uint256 => string) public _uriForId;// Plot metadata URIs
mapping(uint256 => address) public plotToPlanet; // Plot to planet mapping
mapping(uint256 => uint8) public plotZones; // Plot zone numbers

uint256[40] private __gap;
```

### Key Functions
- `initialize(address admin, address plotLimiter)`
- `activate(uint256 plotId, address to, string memory metadataURI, address planetAddress, uint8 zone)`
- `requestTransfer(uint256 plotId, address to)`
- `approveTransfer(uint256 plotId)`
- `getPlotInfo(uint256 plotId) view returns (...)`

### Events
- `PlotActivated(uint256 indexed plotId, address indexed owner, string metadataURI, address planet, uint8 zone)`
- `TransferRequested(uint256 indexed plotId, address from, address to)`
- `TransferApproved(uint256 indexed plotId, address from, address to)`

---

## 3. PlanetPlotLimiterV1

### Purpose
Manages plot issuance limits for planets based on square meters and zone allocations.

### Key Features
- Planet size configuration (2 billion km² for Planet Sarakt)
- Plot size configuration per type (500 m², 2,000 m²)
- Zone-based plot limits (Octavia Capital City: 10,000 plots for zones 1-3)
- Dynamic max plot calculation
- Issued plot tracking

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

struct PlanetConfig {
    uint256 sizeSquareMeters;      // Total planet area
    uint256 plotSizeResidential;   // Residential plot size (500 m²)
    uint256 plotSizeCommercial;    // Commercial plot size (500 m²)
    uint256 plotSizeWorkshop;      // Workshop plot size (2,000 m²)
    bool limitsEnabled;
}

mapping(address => PlanetConfig) public planetConfigs;
mapping(address => uint256) public planetIssuedPlots;
mapping(address => mapping(uint8 => uint256)) public zoneIssuedPlots; // Planet => Zone => Count
mapping(address => uint256) public zoneLimits; // Zone 1-3 limit (10,000 for Octavia Capital City)

uint256[45] private __gap;
```

### Key Functions
- `initialize(address owner, uint256 defaultResidentialSize, uint256 defaultCommercialSize, uint256 defaultWorkshopSize)`
- `setPlanetSize(address planetAddress, uint256 sizeSquareMeters, ...)`
- `setZoneLimit(address planetAddress, uint8 zone, uint256 limit)` // For Octavia Capital City zones 1-3
- `canIssuePlot(address planetAddress, uint8 zone, uint8 plotType) view returns (bool)`
- `getMaxPlots(address planetAddress, uint8 plotType) view returns (uint256)`
- `incrementIssuedPlots(address planetAddress, uint8 zone, uint8 plotType)`

### Events
- `PlanetSizeSet(address indexed planet, uint256 sizeSquareMeters)`
- `PlotLimitReached(address indexed planet, uint8 zone, uint8 plotType)`
- `PlotIssued(address indexed planet, uint8 zone, uint8 plotType, uint256 totalIssued)`

---

## 4. BuildingRegistryV1

### Purpose
Manages building construction on plots with zone-based restrictions.

### Key Features
- Building construction on owned plots
- Building type validation (Residential, Workshop, Commercial)
- Zone restrictions (Commercial in zones 1-3, Workshop outside)
- Building stage tracking (Tribal for Phase 1)
- Building capacity management

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

enum BuildingType { None, Residential, Workshop, Commercial }
enum BuildingStage { None, Tribal }

struct Building {
    BuildingType buildingType;
    BuildingStage stage;
    uint256 plotId;
    address owner;
    uint256 capacity;
    uint256 occupancy;
    string metadataURI;
    uint256 createdAt;
}

mapping(uint256 => Building) public buildings; // plotId => Building
mapping(address => uint256[]) public ownerBuildings; // owner => plotIds[]

uint256[45] private __gap;
```

### Key Functions
- `initialize(address owner, address plotRegistry)`
- `buildBuilding(uint256 plotId, BuildingType buildingType, BuildingStage stage, string memory metadataURI)`
- `demolishBuilding(uint256 plotId)`
- `getBuilding(uint256 plotId) view returns (Building)`
- `validateBuildingAllowed(uint256 plotId, BuildingType buildingType) view returns (bool)`
- `updateBuildingCapacity(uint256 plotId, uint256 newCapacity)`

### Events
- `BuildingConstructed(uint256 indexed plotId, address indexed owner, BuildingType buildingType, BuildingStage stage)`
- `BuildingDemolished(uint256 indexed plotId, address indexed owner)`

---

## 5. ResidentialBuildingV1

### Purpose
Manages residential buildings and rental listings for NPCs.

### Key Features
- Rental listing creation and management
- Tenant assignment by migration system
- Rent amount tracking
- Building capacity management
- Vacancy checking

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

struct RentalListing {
    uint256 plotId;
    address owner;
    uint256 monthlyRent; // In xBGL (wei)
    bool isActive;
    uint256 capacity;
    uint256 occupied;
}

mapping(uint256 => RentalListing) public rentals; // plotId => RentalListing
mapping(uint256 => address[]) public tenants; // plotId => tenant addresses
mapping(address => uint256) public tenantToPlot; // tenant => plotId

address public buildingRegistry;
address public migrationSystem;

uint256[45] private __gap;
```

### Key Functions
- `initialize(address owner, address buildingRegistry, address migrationSystem)`
- `createRentalListing(uint256 plotId, uint256 monthlyRent)`
- `updateRent(uint256 plotId, uint256 newRent)`
- `cancelRentalListing(uint256 plotId)`
- `assignTenant(uint256 plotId, address tenant) onlyMigrationSystem`
- `removeTenant(uint256 plotId, address tenant)`
- `getAvailableRentals(address cityAddress) view returns (RentalListing[])`

### Events
- `RentalListed(uint256 indexed plotId, address indexed owner, uint256 monthlyRent)`
- `TenantAssigned(uint256 indexed plotId, address indexed tenant)`
- `TenantRemoved(uint256 indexed plotId, address indexed tenant)`

---

## 6. WorkshopBuildingV1

### Purpose
Manages workshop buildings and job postings for NPCs.

### Key Features
- Job posting creation and management
- Employee hiring by migration system
- Wage amount tracking
- Building capacity management
- Open positions checking

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

struct JobPosting {
    uint256 plotId;
    address owner;
    uint256 wage; // Per month in xBGL (wei)
    bool isActive;
    uint256 positions;
    uint256 filled;
}

mapping(uint256 => JobPosting) public jobs; // plotId => JobPosting
mapping(uint256 => address[]) public employees; // plotId => employee addresses
mapping(address => uint256) public employeeToPlot; // employee => plotId

address public buildingRegistry;
address public migrationSystem;

uint256[45] private __gap;
```

### Key Functions
- `initialize(address owner, address buildingRegistry, address migrationSystem)`
- `createJobPosting(uint256 plotId, uint256 wage, uint256 positions)`
- `updateWage(uint256 plotId, uint256 newWage)`
- `cancelJobPosting(uint256 plotId)`
- `hireEmployee(uint256 plotId, address employee) onlyMigrationSystem`
- `fireEmployee(uint256 plotId, address employee)`
- `getAvailableJobs(address cityAddress) view returns (JobPosting[])`

### Events
- `JobPosted(uint256 indexed plotId, address indexed owner, uint256 wage, uint256 positions)`
- `EmployeeHired(uint256 indexed plotId, address indexed employee)`
- `EmployeeFired(uint256 indexed plotId, address indexed employee)`

---

## 7. NPCMigrationSystemV1

### Purpose
Orchestrates NPC migration to cities requiring both jobs and housing.

### Key Features
- Migration opportunity finding
- NPC assignment to jobs and housing simultaneously
- City population synchronization
- Migration cooldown enforcement
- Batch migration processing

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

address public residentialBuilding;
address public workshopBuilding;
address public cityContract;

mapping(address => uint256) public lastMigration; // NPC => timestamp
uint256 public migrationCooldown; // Seconds

uint256[48] private __gap;
```

### Key Functions
- `initialize(address owner, address residentialBuilding, address workshopBuilding, address cityContract)`
- `migrateNPC(address npcAddress, address cityAddress)`
- `migrateNPCsBatch(address[] memory npcAddresses, address cityAddress)`
- `findMigrationOpportunities(address cityAddress) view returns (uint256 jobsAvailable, uint256 housingAvailable)`
- `setMigrationCooldown(uint256 cooldown) onlyOwner`

### Events
- `NPCMigrated(address indexed npc, address indexed city, uint256 plotIdJob, uint256 plotIdHousing, uint256 timestamp)`

---

## 8. CityTreasuryV1

### Purpose
Manages treasury for individual cities with integration to City contract.

### Key Features
- Native token (xBGL) deposits and withdrawals
- ERC20 token deposits and withdrawals
- City-specific access control
- Revenue collection
- Tribute payment to Planet Treasury

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

address public cityContract;
address public planetTreasury;
uint256 public tributePercentage; // Basis points (e.g., 1000 = 10%)

mapping(address => bool) public supportedTokens;
mapping(address => uint256) public balances; // token => balance

uint256[45] private __gap;
```

### Key Functions
- `initialize(address owner, address cityContract, address planetTreasury, uint256 tributePercentage)`
- `deposit() payable`
- `depositToken(address token, uint256 amount)`
- `withdraw(uint256 amount) onlyOwner`
- `withdrawToken(address token, uint256 amount) onlyOwner`
- `payTribute() onlyOwner` // Pay tribute to Planet Treasury

### Events
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`
- `TributePaid(address indexed planetTreasury, uint256 amount)`

---

## 9. PlanetTreasuryV1

### Purpose
Manages treasury for individual planets with tribute to Star System Treasury.

### Key Features
- Native token deposits and withdrawals
- ERC20 token deposits and withdrawals
- Planet-specific access control
- Receives tribute from City Treasuries
- Tribute payment to Star System Treasury

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

address public planetContract;
address public starSystemTreasury;
uint256 public tributePercentage; // Basis points

mapping(address => bool) public supportedTokens;
mapping(address => uint256) public balances;
mapping(address => uint256) public cityTributes; // cityTreasury => total tribute received

uint256[44] private __gap;
```

### Key Functions
- `initialize(address owner, address planetContract, address starSystemTreasury, uint256 tributePercentage)`
- `receiveTribute(address cityTreasury, uint256 amount) payable`
- `receiveTributeToken(address cityTreasury, address token, uint256 amount)`
- `withdraw(uint256 amount) onlyOwner`
- `withdrawToken(address token, uint256 amount) onlyOwner`
- `payTribute() onlyOwner` // Pay tribute to Star System Treasury

### Events
- `TributeReceived(address indexed cityTreasury, uint256 amount)`
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`

---

## 10. StarSystemTreasuryV1

### Purpose
Manages treasury for star systems receiving tribute from Planet Treasuries.

### Key Features
- Native token deposits and withdrawals
- ERC20 token deposits and withdrawals
- Star system-specific access control
- Receives tribute from Planet Treasuries
- Tribute percentage management

### Storage Layout
```solidity
// OwnableUpgradeable, UUPSUpgradeable base

address public starSystemContract;
mapping(address => bool) public supportedTokens;
mapping(address => uint256) public balances;
mapping(address => uint256) public planetTributes; // planetTreasury => total tribute received

uint256[46] private __gap;
```

### Key Functions
- `initialize(address owner, address starSystemContract)`
- `receiveTribute(address planetTreasury, uint256 amount) payable`
- `receiveTributeToken(address planetTreasury, address token, uint256 amount)`
- `withdraw(uint256 amount) onlyOwner`
- `withdrawToken(address token, uint256 amount) onlyOwner`

### Events
- `TributeReceived(address indexed planetTreasury, uint256 amount)`
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`

---

## Treasury Hierarchy

```
Star System Treasury
    ↑ (tribute)
Planet Treasury
    ↑ (tribute)
City Treasury
    ↑ (revenue)
City Activities (plot sales, etc.)
```

## Upgrade Safety

All contracts:
- Use storage gaps for future expansion
- Follow OpenZeppelin upgradeable patterns
- Require multisig admin for upgrades
- Preserve state during upgrades
- Validate storage layout before upgrades

## Security Considerations

- All admin functions protected by `onlyOwner` (multisig)
- Reentrancy guards on payable functions
- Input validation on all functions
- Access control via OpenZeppelin AccessControl
- Pausable functionality for emergency stops

