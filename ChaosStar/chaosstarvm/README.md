# ChaosStarVM

**High-Performance Blockchain for the Chaos Star Network**

Built with [HyperSDK](https://github.com/ava-labs/hypersdk) - Ava Labs' opinionated framework for building hyper-scalable blockchains on Avalanche.

## Overview

ChaosStarVM is a custom Avalanche Virtual Machine that implements the complete Chaos Star Network logic:

- **Multi-Token Economy**: xBGL (reserve currency), Chaos, and Xen tokens
- **Plot System**: Purchase, upgrade, and transfer land plots
- **NPC Management**: Create, train, assign, and relocate NPCs
- **Star Systems**: Create subnets as star systems
- **Planets**: Validators represented as planets
- **Cities**: Build and manage cities with economies
- **Treasury**: Cross-validator swaps, token exchanges, validator rewards

## Architecture

```
chaosstarvm/
├── actions/          # All transaction types (Transfer, Plot, NPC, etc.)
├── consts/           # Constants and type IDs
├── storage/          # State management (multi-token balances, plots, NPCs)
├── vm/               # VM factory, parsers, JSON-RPC handlers
├── cmd/
│   ├── chaosstarvm/  # VM binary entry point
│   └── chaosstar-cli/# CLI for interacting with the chain
├── genesis/          # Genesis file template
└── scripts/          # Build and deployment scripts
```

## Actions

| Category | Action | Description |
|----------|--------|-------------|
| **Transfer** | Transfer | Multi-token transfer between accounts |
| **Plot** | PlotPurchase | Purchase a plot at coordinates |
| | PlotUpgrade | Upgrade a plot's level |
| | PlotTransfer | Transfer plot ownership |
| **NPC** | NPCCreate | Create a new NPC |
| | NPCTrain | Train NPC skills |
| | NPCAssign | Assign NPC to a task |
| | NPCRelocate | Move NPC to new location |
| **Star System** | StarSystemCreate | Create a new star system (subnet) |
| | StarSystemUpdate | Update star system status |
| **Planet** | PlanetCreate | Create a planet (validator) |
| | PlanetUpdate | Update planet status |
| **City** | CityCreate | Create a new city |
| | CityUpdateEconomy | Update city tax rate |
| **Treasury** | TokenSwap | Swap tokens via treasury |
| | CrossValidatorSwap | Swap between validator tokens |
| | ValidatorRegister | Register a new validator |
| | TreasuryDeposit | Deposit tokens to treasury |

## Token Types

| ID | Token | Description |
|----|-------|-------------|
| 0 | xBGL | Global reserve currency |
| 1 | Chaos | Sarakt Prime Validator token |
| 2 | Xen | Zythera Validator token |

## Quick Start

### Prerequisites

- Go 1.22+
- AvalancheGo
- Avalanche CLI (optional, for deployment)

### Build

```bash
# Build VM and CLI
./scripts/build.sh

# Outputs:
#   build/chaosstarvm    - VM binary
#   build/chaosstar-cli  - CLI binary
```

### Deploy Locally

```bash
# Using Avalanche CLI
avalanche blockchain create chaosstar --vm chaosstarvm --genesis genesis/genesis.json
avalanche blockchain deploy chaosstar --local

# Or use the deploy script
./scripts/deploy.sh
```

### CLI Usage

```bash
# Generate a new key
chaosstar-cli key generate

# Check balance
chaosstar-cli chain balance <address>

# Transfer tokens
chaosstar-cli action transfer <to> <amount> <token>

# Purchase a plot
chaosstar-cli action buy-plot <x> <y> <price>

# Create an NPC
chaosstar-cli action create-npc <npc-id> <x> <y>

# Create a city
chaosstar-cli action create-city <name> <x> <y>

# Create a star system
chaosstar-cli action create-star-system <id> <name>

# Create a planet
chaosstar-cli action create-planet <id> <name> <star-system-id>

# Swap tokens
chaosstar-cli action swap <token-in> <token-out> <amount>
```

## Genesis Configuration

The genesis file (`genesis/genesis.json`) configures:

- Network HRP (Human-Readable Part): `chaosstar`
- Initial token allocations
- Treasury liquidity for each token
- Pre-registered validators

## Development

### Run Tests

```bash
go test -v ./...
```

### Run E2E Tests

```bash
go test -v ./tests/e2e/...
```

## Integration with Existing ChaosStar

This HyperSDK-based VM implements the same logic as the Rust-based `chaosstar-vm` but with:

- Native Go implementation for Avalanche compatibility
- HyperSDK's high-performance transaction processing
- Built-in state prefetching and pessimistic concurrency control
- Multi-dimensional fee system
- Warp messaging support (for cross-subnet communication)

## License

Copyright (C) 2024, ChaosStar Network. All rights reserved.


