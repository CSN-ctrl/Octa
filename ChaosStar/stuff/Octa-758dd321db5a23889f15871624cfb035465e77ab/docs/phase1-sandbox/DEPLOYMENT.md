# Phase 1 Contract Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying all Phase 1 contracts to the sandbox environment. Contracts must be deployed in dependency order.

## Deployment Order

### Phase 1: Independent Contracts
1. SaraktTreasuryV1
2. SaraktDigitalIDV1
3. AccountRegistryV1
4. PlanetPlotLimiterV1

### Phase 2: Dependent Contracts
5. SaraktLandV2V1 (requires Treasury + DigitalID)
6. PlotRegistry1155V1 (requires PlanetPlotLimiter)

### Phase 3: Building System
7. BuildingRegistryV1 (requires PlotRegistry)
8. ResidentialBuildingV1 (requires BuildingRegistry)
9. WorkshopBuildingV1 (requires BuildingRegistry)
10. NPCMigrationSystemV1 (requires Residential + Workshop + City)

### Phase 4: Treasury Hierarchy
11. CityTreasuryV1 (requires City contract)
12. PlanetTreasuryV1 (requires Planet contract + CityTreasury)
13. StarSystemTreasuryV1 (requires StarSystem contract + PlanetTreasury)

### Phase 5: Supporting Contracts
14. City Contract
15. Planet Contract
16. StarSystem Contract

## Prerequisites

1. Anvil node running on `http://127.0.0.1:8545`
2. Foundry installed and configured
3. All dependencies installed (OpenZeppelin contracts)
4. Private keys for deployment (Anvil accounts)
5. Environment variables configured

## Deployment Script Structure

```
forge-contracts/script/
├── sandbox/
│   ├── DeploySandbox.s.sol        # Complete sandbox deployment
│   ├── DeployPhase1.s.sol         # Phase 1 contracts
│   ├── DeployPhase2.s.sol         # Phase 2 contracts
│   ├── DeployPhase3.s.sol         # Phase 3 contracts
│   └── DeployPhase4.s.sol         # Phase 4 contracts
├── deploy/
│   ├── DeployTreasury.s.sol       # Treasury deployment
│   ├── DeployLand.s.sol           # Land contract deployment
│   └── ...
└── upgrade/
    └── UpgradeV1ToV2.s.sol        # Upgrade scripts
```

## Deployment Configuration

### Initialization Parameters

#### SaraktTreasuryV1
```solidity
address _owner,                    // Multisig admin address
address[] memory _supportedTokens  // Array of supported ERC20 token addresses
```

#### SaraktDigitalIDV1
```solidity
address _owner                     // Multisig admin address
```

#### AccountRegistryV1
```solidity
address _owner                     // Multisig admin address
```

#### PlanetPlotLimiterV1
```solidity
address _owner,                    // Multisig admin address
uint256 _defaultResidentialSize,   // 500 (m²)
uint256 _defaultCommercialSize,    // 500 (m²)
uint256 _defaultWorkshopSize       // 2000 (m²)
```

#### SaraktLandV2V1
```solidity
address _owner,                    // Multisig admin address
address _treasury,                 // SaraktTreasuryV1 address
address _digitalID,                // SaraktDigitalIDV1 address
string memory _defaultURI,         // Default metadata URI
uint256 _plotPriceEUR,             // 10000 (100.00 EUR with 2 decimals)
uint256 _initialEurXbglRate,       // 1955833 (1.955833 with 6 decimals)
uint256 _initialEurUsdcRate,       // 11000 (1.10 with 4 decimals)
address _swapRouter,               // DEX router address
address _exchangeRateOracle        // Oracle address (can be address(0))
```

#### PlotRegistry1155V1
```solidity
address _admin,                    // Multisig admin address
address _plotLimiter               // PlanetPlotLimiterV1 address
```

#### BuildingRegistryV1
```solidity
address _owner,                    // Multisig admin address
address _plotRegistry              // PlotRegistry1155V1 address
```

#### ResidentialBuildingV1
```solidity
address _owner,                    // Multisig admin address
address _buildingRegistry,         // BuildingRegistryV1 address
address _migrationSystem           // NPCMigrationSystemV1 address (can be address(0) initially)
```

#### WorkshopBuildingV1
```solidity
address _owner,                    // Multisig admin address
address _buildingRegistry,         // BuildingRegistryV1 address
address _migrationSystem           // NPCMigrationSystemV1 address (can be address(0) initially)
```

#### NPCMigrationSystemV1
```solidity
address _owner,                    // Multisig admin address
address _residentialBuilding,      // ResidentialBuildingV1 address
address _workshopBuilding,         // WorkshopBuildingV1 address
address _cityContract,             // City contract address
uint256 _migrationCooldown         // Cooldown in seconds (e.g., 604800 = 7 days)
```

#### CityTreasuryV1
```solidity
address _owner,                    // Multisig admin address
address _cityContract,             // City contract address
address _planetTreasury,           // PlanetTreasuryV1 address
uint256 _tributePercentage         // 1000 (10% in basis points)
```

#### PlanetTreasuryV1
```solidity
address _owner,                    // Multisig admin address
address _planetContract,           // Planet contract address
address _starSystemTreasury,       // StarSystemTreasuryV1 address
uint256 _tributePercentage         // 1000 (10% in basis points)
```

#### StarSystemTreasuryV1
```solidity
address _owner,                    // Multisig admin address
address _starSystemContract        // StarSystem contract address
```

## Deployment Steps

### Step 1: Start Anvil

```bash
anvil \
  --chain-id 8088 \
  --block-time 1 \
  --accounts 20 \
  --balance 10000 \
  --host 127.0.0.1 \
  --port 8545
```

### Step 2: Deploy All Contracts

```bash
# Deploy complete sandbox
forge script script/sandbox/DeploySandbox.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -vvv
```

### Step 3: Configure Contracts

After deployment, configure contracts:

```bash
# Configure Planet Sarakt
cast send <PlanetPlotLimiter> \
  "setPlanetSize(address,uint256,uint256,uint256,uint256)" \
  <PlanetAddress> 2000000000000000 500 500 2000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>

# Set Octavia Capital City zone limits
cast send <PlanetPlotLimiter> \
  "setZoneLimit(address,uint8,uint256)" \
  <CityAddress> 1 10000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>
```

### Step 4: Verify Deployment

```bash
# Run tests
forge test --rpc-url http://127.0.0.1:8545

# Check contract code
cast code <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545

# Call view function
cast call <CONTRACT_ADDRESS> "plotPriceEUR()" --rpc-url http://127.0.0.1:8545
```

## Post-Deployment Configuration

### 1. Configure Planet Sarakt

```solidity
// Set planet size: 2 billion km² = 2,000,000,000,000,000 m²
planetPlotLimiter.setPlanetSize(
    planetSaraktAddress,
    2_000_000_000_000_000,  // 2 billion km² in m²
    500,                     // Residential plot size (m²)
    500,                     // Commercial plot size (m²)
    2000                     // Workshop plot size (m²)
);

// Set Octavia Capital City zone limits (zones 1-3: 10,000 plots)
planetPlotLimiter.setZoneLimit(octaviaCapitalCityAddress, 1, 10_000);
planetPlotLimiter.setZoneLimit(octaviaCapitalCityAddress, 2, 10_000);
planetPlotLimiter.setZoneLimit(octaviaCapitalCityAddress, 3, 10_000);
```

### 2. Configure Exchange Rates

```solidity
// Set initial EUR/xBGL rate: 1 EUR = 1.955833 xBGL
land.updateEurXbglRate(1_955_833); // 6 decimals

// Set initial EUR/USDC rate: 1 EUR = 1.10 USDC (example)
land.updateEurUsdcRate(11_000); // 4 decimals (or match USDC decimals)
```

### 3. Link Contracts

```solidity
// Link NPCMigrationSystem with buildings
migrationSystem.setResidentialBuilding(residentialBuildingAddress);
migrationSystem.setWorkshopBuilding(workshopBuildingAddress);

// Update building contracts with migration system
residentialBuilding.setMigrationSystem(migrationSystemAddress);
workshopBuilding.setMigrationSystem(migrationSystemAddress);
```

### 4. Setup Treasury Hierarchy

```solidity
// Configure tribute percentages
cityTreasury.setTributePercentage(1_000); // 10%
planetTreasury.setTributePercentage(1_000); // 10%

// Link treasuries
cityTreasury.setPlanetTreasury(planetTreasuryAddress);
planetTreasury.setStarSystemTreasury(starSystemTreasuryAddress);
```

## Address Registry

After deployment, save all addresses to a registry file:

```json
{
  "saraktTreasury": "0x...",
  "saraktDigitalID": "0x...",
  "accountRegistry": "0x...",
  "planetPlotLimiter": "0x...",
  "saraktLandV2": "0x...",
  "plotRegistry1155": "0x...",
  "buildingRegistry": "0x...",
  "residentialBuilding": "0x...",
  "workshopBuilding": "0x...",
  "npcMigrationSystem": "0x...",
  "cityTreasury": "0x...",
  "planetTreasury": "0x...",
  "starSystemTreasury": "0x...",
  "city": "0x...",
  "planet": "0x...",
  "starSystem": "0x..."
}
```

## Deployment Verification

### Verify Each Contract

```bash
# Check implementation contract
cast code <IMPLEMENTATION_ADDRESS> --rpc-url http://127.0.0.1:8545

# Check proxy contract
cast code <PROXY_ADDRESS> --rpc-url http://127.0.0.1:8545

# Verify ownership
cast call <CONTRACT> "owner()" --rpc-url http://127.0.0.1:8545

# Verify initialization
cast call <LAND_CONTRACT> "plotPriceEUR()" --rpc-url http://127.0.0.1:8545
```

### Verify Dependencies

```bash
# Verify Land contract has Treasury
cast call <LAND_CONTRACT> "treasury()" --rpc-url http://127.0.0.1:8545

# Verify PlotRegistry has PlanetPlotLimiter
cast call <PLOT_REGISTRY> "plotLimiter()" --rpc-url http://127.0.0.1:8545
```

## Upgrade Deployment

### Deploying Upgrades

```bash
# Deploy new implementation
forge script script/upgrade/UpgradeV1ToV2.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key <PRIVATE_KEY> \
  -vvv

# Verify upgrade
forge test --match-test testUpgrade --rpc-url http://127.0.0.1:8545
```

### Verify Storage Layout

Before upgrading, verify storage layout compatibility:
- Check storage gap is sufficient
- Verify no storage variable reordering
- Confirm new variables appended at end

## Troubleshooting

### Common Issues

**Deployment Fails:**
- Check Anvil is running
- Verify private key has balance
- Check contract dependencies are deployed first
- Verify initialization parameters are correct

**Initialization Fails:**
- Check proxy pattern is correct
- Verify `_disableInitializers()` is called
- Confirm implementation is not initialized directly

**Dependency Errors:**
- Deploy contracts in correct order
- Verify contract addresses are correct
- Check contracts are initialized before linking

## Security Checklist

Before deployment:

- [ ] All contracts compiled without errors
- [ ] All tests pass
- [ ] Storage layout verified
- [ ] Admin addresses are multisig
- [ ] Initialization parameters validated
- [ ] Dependencies verified
- [ ] Address registry saved
- [ ] Documentation updated

## Production Deployment

For production deployment:

1. **Use Testnet First**: Deploy to Sepolia/Goerli first
2. **Verify Contracts**: Verify on block explorer
3. **Test Thoroughly**: Run all tests on testnet
4. **Audit Contracts**: Consider professional audit
5. **Multisig Setup**: Ensure multisig is configured
6. **Timelock Setup**: Configure timelock for upgrades
7. **Monitor**: Set up monitoring and alerts

## Deployment Script Example

See `script/sandbox/DeploySandbox.s.sol` for complete deployment script example.

