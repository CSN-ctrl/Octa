# Phase 1 Sandbox Testing Guide

## Overview

This guide provides comprehensive instructions for testing all Phase 1 contracts in the sandbox environment. The sandbox runs on a local Anvil node, allowing isolated testing without network deployment.

## Test Structure

```
forge-contracts/test/
├── unit/               # Individual contract unit tests
├── integration/        # Contract interaction tests
├── upgrade/            # Contract upgrade tests
├── fixtures/           # Test fixtures and setup
└── utils/              # Test utilities and helpers
```

## Running Tests

### Basic Test Execution

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test contract
forge test --match-contract SaraktLandV2V1

# Run specific test function
forge test --match-test testBuyPlotWithUSDC

# Run with gas report
forge test --gas-report

# Run against local Anvil node
forge test --rpc-url http://127.0.0.1:8545
```

### Test Categories

```bash
# Run unit tests only
forge test --match-path test/unit

# Run integration tests only
forge test --match-path test/integration

# Run upgrade tests only
forge test --match-path test/upgrade
```

## Test Categories

### 1. Unit Tests

Test individual contracts in isolation.

#### SaraktLandV2V1 Tests
- ✅ Test initialization
- ✅ Test buyPlotWithAVAX
- ✅ Test buyPlotWithUSDC with auto-swap
- ✅ Test price calculation (EUR → xBGL, EUR → USDC)
- ✅ Test exchange rate updates
- ✅ Test EUR price updates
- ✅ Test sales activation/deactivation
- ✅ Test digital ID requirement
- ✅ Test batch purchases
- ✅ Test payment routing (33%/67% split)

#### PlotRegistry1155V1 Tests
- ✅ Test initialization
- ✅ Test plot activation
- ✅ Test zone limit enforcement (10,000 plots for zones 1-3)
- ✅ Test plot type validation
- ✅ Test transfer requests
- ✅ Test admin-approved transfers
- ✅ Test ERC-1155 functions

#### PlanetPlotLimiterV1 Tests
- ✅ Test initialization
- ✅ Test planet size configuration (2 billion km²)
- ✅ Test plot limit calculation
- ✅ Test zone limits (Octavia Capital City: 10,000 plots)
- ✅ Test canIssuePlot validation
- ✅ Test issued plot tracking

#### BuildingRegistryV1 Tests
- ✅ Test initialization
- ✅ Test building construction
- ✅ Test zone restrictions
- ✅ Test building type validation
- ✅ Test building demolition

#### ResidentialBuildingV1 Tests
- ✅ Test initialization
- ✅ Test rental listing creation
- ✅ Test tenant assignment
- ✅ Test vacancy checking
- ✅ Test capacity management

#### WorkshopBuildingV1 Tests
- ✅ Test initialization
- ✅ Test job posting creation
- ✅ Test employee hiring
- ✅ Test open positions checking
- ✅ Test capacity management

#### NPCMigrationSystemV1 Tests
- ✅ Test initialization
- ✅ Test migration opportunity finding
- ✅ Test NPC migration (job + housing required)
- ✅ Test city population updates
- ✅ Test migration cooldown

#### Treasury Tests
- ✅ Test CityTreasuryV1 deposits/withdrawals
- ✅ Test PlanetTreasuryV1 tribute receiving
- ✅ Test StarSystemTreasuryV1 tribute receiving
- ✅ Test tribute payment flows

### 2. Integration Tests

Test contract interactions and data flows.

#### Plot Purchase Flow
```
1. Register Digital ID
2. Purchase plot with USDC
3. Auto-swap USDC → xBGL
4. Plot minted to user
5. Ownership verified
```

#### Building Construction Flow
```
1. Purchase plot
2. Build Residential/Workshop building
3. Building registered
4. Capacity set
```

#### NPC Migration Flow
```
1. Residential building lists rental
2. Workshop building posts job
3. NPC migrates (gets both)
4. City population updates
5. Both assignments verified
```

#### Treasury Revenue Flow
```
1. Plot sale → City Treasury
2. City pays tribute → Planet Treasury
3. Planet pays tribute → Star System Treasury
4. All balances verified
```

#### Price Update Flow
```
1. Admin updates EUR price
2. xBGL price recalculates
3. USDC price recalculates
4. Purchase uses new prices
```

#### Exchange Rate Update Flow
```
1. Admin updates EUR/xBGL rate
2. xBGL prices update
3. Admin updates EUR/USDC rate
4. USDC prices update
5. Purchases use new rates
```

### 3. Upgrade Tests

Test contract upgradeability.

#### Storage Layout Preservation
```
1. Deploy V1 contract
2. Set state (prices, balances, etc.)
3. Upgrade to V2
4. Verify all state preserved
```

#### Function Compatibility
```
1. Upgrade V1 → V2
2. Test all V1 functions still work
3. Test new V2 functions work
```

#### Event Compatibility
```
1. Upgrade V1 → V2
2. Verify old events still emit
3. Verify new events work
```

### 4. Edge Cases and Failures

Test error handling and edge cases.

#### Payment Failures
- Insufficient USDC sent
- Swap fails
- Slippage exceeded
- Transaction reverts and refunds USDC

#### Plot Limit Edge Cases
- Issue 10,000th plot in zones 1-3
- Try 10,001st plot → Fails
- Issue last plot on planet
- Try one more → Fails

#### Building Restrictions
- Try Workshop in zones 1-3 → Fails
- Try Commercial outside zones 1-3 → Fails

#### NPC Migration Edge Cases
- Migration with only job → Fails
- Migration with only housing → Fails
- Migration when capacity full → Fails
- Migration during cooldown → Fails

## Test Scenarios

### Scenario 1: Complete User Journey

**Steps:**
1. User registers Digital ID
2. User purchases Residential plot (Zone 1)
3. User purchases Workshop plot (Zone 4)
4. User builds Residential building
5. User builds Workshop building
6. User lists rental
7. User posts job
8. NPC migrates to city
9. City population increases
10. Rent and wages collected

**Expected Results:**
- All transactions succeed
- Plots owned by user
- Buildings registered
- NPC assigned to job and housing
- City population = 1

### Scenario 2: Multiple Users and NPCs

**Steps:**
1. 5 users purchase plots
2. 3 users build Residential buildings
3. 2 users build Workshop buildings
4. All list rentals/jobs
5. 10 NPCs migrate (matching opportunities)
6. Verify all assignments

**Expected Results:**
- All 10 NPCs assigned
- City population = 10
- All rentals occupied
- All jobs filled

### Scenario 3: Admin Operations

**Steps:**
1. Admin sets planet size (2 billion km²)
2. Admin configures zones
3. Admin sets plot price EUR (100 EUR)
4. Admin updates exchange rates
5. Plots purchased at new prices

**Expected Results:**
- Planet configured correctly
- Plot prices update
- Purchases use new prices

### Scenario 4: Treasury Revenue Flow

**Steps:**
1. User purchases plot (100 EUR = ~195.58 xBGL)
2. Payment split (33% reserve, 67% operational)
3. Operational share to City Treasury
4. City pays 10% tribute to Planet Treasury
5. Planet pays 10% tribute to Star System Treasury

**Expected Results:**
- Reserve Treasury: 64.54 xBGL
- City Treasury: 117.94 xBGL
- Planet Treasury: 11.79 xBGL
- Star System Treasury: 1.31 xBGL

### Scenario 5: Zone Restrictions

**Steps:**
1. Purchase plot in zones 1-3
2. Try to build Workshop → Fails
3. Build Commercial → Succeeds
4. Purchase plot outside zones 1-3
5. Try to build Commercial → Fails
6. Build Workshop → Succeeds

**Expected Results:**
- Zone restrictions enforced
- Correct building types allowed
- Incorrect types rejected

## Writing Tests

### Test Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SaraktLandV2V1} from "../../src/upgradeable/SaraktLandV2V1.sol";

contract SaraktLandV2V1Test is Test {
    SaraktLandV2V1 public land;
    address public admin = address(1);
    address public user = address(2);

    function setUp() public {
        // Deploy contracts
        // Setup test environment
    }

    function testBuyPlotWithUSDC() public {
        // Arrange
        uint256 plotId = 1;
        uint256 usdcAmount = 110e6; // 110 USDC

        // Act
        land.buyPlotWithUSDC(plotId, usdcAmount);

        // Assert
        assertEq(land.balanceOf(user, plotId), 1);
    }
}
```

### Using Fixtures

```solidity
import {DeployFixture} from "../fixtures/DeployFixture.sol";

contract MyTest is Test, DeployFixture {
    function setUp() public {
        // Use fixture for common setup
        deployFixture();
    }

    function testSomething() public {
        // Use deployed contracts from fixture
        land.buyPlotWithUSDC(1, 110e6);
    }
}
```

## Test Data

### Test Accounts
- Admin: `address(1)` or Anvil account #0
- User1-10: `address(2-11)` or Anvil accounts #1-10
- NPCs: `address(100-119)` - 20 NPC addresses

### Test Plots
- Plots 1-100: Residential (zones 1-3)
- Plots 101-200: Commercial (zones 1-3)
- Plots 201-300: Workshop (outside zones 1-3)

### Test Configuration
- Planet Sarakt: 2,000,000,000 km²
- Octavia Capital City: Zones 1-3, 10,000 plots
- Plot Price: 100 EUR
- EUR/xBGL Rate: 1.955833
- EUR/USDC Rate: 1.10

## Test Coverage Goals

### Target Coverage
- Unit Tests: 100% function coverage
- Integration Tests: All major flows covered
- Upgrade Tests: All contracts upgradable
- Edge Cases: All failure scenarios tested

### Current Status
Track test coverage with:
```bash
forge coverage
forge coverage --report lcov
```

## Debugging Tests

### Verbose Output
```bash
forge test -vvv  # 3 verbosity levels
forge test -vvvv # 4 verbosity levels (traces)
```

### Console Logging
```solidity
console.log("Value:", value);
console.log("Address:", addr);
```

### Debugging Failed Tests
1. Check transaction traces
2. Verify event emissions
3. Check state changes
4. Verify function inputs/outputs

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-actions/setup-foundry@v1
      - run: forge test
      - run: forge coverage
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Use Fixtures**: Share common setup code
3. **Test Edge Cases**: Include boundary conditions
4. **Clear Assertions**: Use descriptive assert messages
5. **Mock Dependencies**: Use mock contracts when needed
6. **Test Events**: Verify events are emitted correctly
7. **Gas Optimization**: Monitor gas usage in tests

## Test Checklist

Before considering tests complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All upgrade tests pass
- [ ] Edge cases tested
- [ ] Error handling verified
- [ ] Events verified
- [ ] Gas usage acceptable
- [ ] Test coverage > 90%
- [ ] Documentation updated

