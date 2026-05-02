# Phase 1 Sandbox Documentation

## Overview

This documentation provides complete specifications and guides for the Phase 1 smart contract sandbox environment. The sandbox is a fully isolated testing environment where all Phase 1 functionality can be tested without deploying to any network.

## Documentation Structure

- **[Setup Guide](./SETUP.md)** - Complete setup instructions for the sandbox environment
- **[Contract Specifications](./CONTRACTS.md)** - Detailed specifications for all Phase 1 contracts
- **[Treasury System](./TREASURY.md)** - Treasury hierarchy and revenue flow documentation
- **[Testing Guide](./TESTING.md)** - Comprehensive testing documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Contract deployment instructions
- **[API Reference](./API.md)** - Function reference for all contracts
- **[Test Summary](./TEST_SUMMARY.md)** - Complete test case summary

## Quick Start

1. Read the [Setup Guide](./SETUP.md) to set up your local environment
2. Review [Contract Specifications](./CONTRACTS.md) to understand the architecture
3. Follow the [Testing Guide](./TESTING.md) to run tests
4. Use the [API Reference](./API.md) when developing

## Key Features

- **16 Contracts** - All Phase 1 contracts including 3 new treasury contracts
- **Local Testing** - Complete Anvil-based sandbox environment
- **Upgradeable** - All contracts use UUPS proxy pattern
- **Air-Gapped Security** - Multisig admin control
- **ERC-1155** - Land plots as ERC-1155 tokens
- **Building System** - Residential and Workshop buildings
- **NPC Migration** - Population mechanics with jobs and housing
- **EUR-Based Pricing** - Adjustable EUR prices, displayed in xBGL, paid in USDC

## Contracts Overview

### Core Contracts (5)
1. SaraktLandV2V1 - Land plot sales
2. PlotRegistry1155V1 - Plot registry
3. SaraktDigitalIDV1 - Identity management
4. SaraktTreasuryV1 - Main treasury
5. AccountRegistryV1 - Account management

### New Phase 1 Contracts (5)
6. PlanetPlotLimiterV1 - Plot limit management
7. BuildingRegistryV1 - Building system
8. ResidentialBuildingV1 - Residential buildings
9. WorkshopBuildingV1 - Workshop buildings
10. NPCMigrationSystemV1 - NPC migration

### Treasury Contracts (3 New)
11. CityTreasuryV1 - City-level treasury
12. PlanetTreasuryV1 - Planet-level treasury
13. StarSystemTreasuryV1 - Star system-level treasury

### Supporting Contracts (3)
14. City Contract - City management
15. Planet Contract - Planet management
16. StarSystem Contract - Star system management

## Configuration

### Planet Sarakt
- **Size**: 2,000,000,000 square kilometers (2 billion km²)
- **Plot Limits**: Calculated dynamically from area and plot sizes

### Octavia Capital City
- **Zones 1-3**: Fixed 10,000 plots total
- **Zone Restrictions**: Commercial in zones 1-3 only, Workshop outside

### Plot Sizes
- **Residential**: 500 m² (all zones)
- **Workshop**: 2,000 m² (non-central zones)
- **Commercial**: 500 m² (central zones only)

### Payment System
- **Base Price**: Adjustable in EUR (starts at 100 EUR)
- **EUR/xBGL Rate**: Variable, starts at 1.955833 (not pegged)
- **Display**: Prices shown in xBGL
- **Payment**: Users pay in USDC (auto-swapped to xBGL)

## Support

For questions or issues, refer to the specific documentation sections or check the test suite for examples.

