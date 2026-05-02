# Phase 1 Sandbox Test Summary

## Overview

This document provides a comprehensive summary of all tests for the Phase 1 sandbox environment. The sandbox is separate from frontend integration and focuses on smart contract functionality testing.

## Test Statistics

- **Total Contracts**: 16 contracts
- **Total Test Cases**: ~390+ test cases
- **Test Categories**: 5 categories
- **Expected Execution Time**: 70-100 minutes for complete suite

## Test Categories

### 1. Unit Tests (~200+ test cases)

#### SaraktLandV2V1 (20 tests)
- ✅ Initialization
- ✅ buyPlotWithAVAX
- ✅ buyPlotWithUSDC with auto-swap
- ✅ Price calculation (EUR → xBGL, EUR → USDC)
- ✅ Exchange rate updates
- ✅ EUR price updates
- ✅ Sales activation/deactivation
- ✅ Digital ID requirement
- ✅ Batch purchases
- ✅ Payment routing (33%/67% split)
- ✅ Event emissions
- ✅ Reentrancy protection
- ✅ Access control
- ✅ Error handling

#### PlotRegistry1155V1 (15 tests)
- ✅ Initialization
- ✅ Plot activation
- ✅ Zone limit enforcement (10,000 plots zones 1-3)
- ✅ Plot type validation
- ✅ Transfer requests
- ✅ Admin-approved transfers
- ✅ ERC-1155 functions
- ✅ Metadata URI storage
- ✅ Pause/unpause

#### PlanetPlotLimiterV1 (18 tests)
- ✅ Initialization
- ✅ Planet size configuration (2 billion km²)
- ✅ Plot size configuration (500 m², 2,000 m²)
- ✅ Zone limits (Octavia Capital City: 10,000 plots)
- ✅ Plot limit calculation
- ✅ canIssuePlot validation
- ✅ Issued plot tracking
- ✅ Remaining plots calculation

#### BuildingRegistryV1 (15 tests)
- ✅ Initialization
- ✅ Building construction
- ✅ Zone restrictions
- ✅ Building type validation
- ✅ Building demolition
- ✅ Capacity management

#### ResidentialBuildingV1 (15 tests)
- ✅ Initialization
- ✅ Rental listing creation
- ✅ Tenant assignment
- ✅ Vacancy checking
- ✅ Capacity management

#### WorkshopBuildingV1 (15 tests)
- ✅ Initialization
- ✅ Job posting creation
- ✅ Employee hiring
- ✅ Open positions checking
- ✅ Capacity management

#### NPCMigrationSystemV1 (18 tests)
- ✅ Initialization
- ✅ Migration opportunity finding
- ✅ NPC migration (job + housing required)
- ✅ City population updates
- ✅ Migration cooldown
- ✅ Batch migration

#### CityTreasuryV1 (12 tests)
- ✅ Initialization
- ✅ Native token deposits
- ✅ ERC20 token deposits
- ✅ Withdrawals
- ✅ Tribute payments

#### PlanetTreasuryV1 (12 tests)
- ✅ Initialization
- ✅ Tribute receipt
- ✅ Withdrawals
- ✅ Tribute payment to Star System

#### StarSystemTreasuryV1 (12 tests)
- ✅ Initialization
- ✅ Tribute receipt
- ✅ Withdrawals
- ✅ Tribute tracking

#### SaraktDigitalIDV1 (10 tests)
- ✅ Registration
- ✅ Retrieval
- ✅ Deactivation

#### AccountRegistryV1 (10 tests)
- ✅ Account creation
- ✅ Account updates
- ✅ Joint members
- ✅ Sub-accounts

#### Supporting Contracts (20 tests)
- ✅ City Contract
- ✅ Planet Contract
- ✅ StarSystem Contract

### 2. Integration Tests (~50+ test scenarios)

#### Plot Purchase Flow (8 tests)
- ✅ Complete purchase flow (Digital ID → Purchase → Swap → Mint)
- ✅ Payment routing to treasuries
- ✅ Ownership verification
- ✅ Event chain verification

#### Building Construction Flow (6 tests)
- ✅ Plot purchase → Building construction
- ✅ Zone validation during construction
- ✅ Building registration

#### NPC Migration Flow (10 tests)
- ✅ Residential listing → Workshop posting → Migration
- ✅ Both assignments verified
- ✅ City population update
- ✅ Capacity checks

#### Treasury Revenue Flow (8 tests)
- ✅ Plot sale → City Treasury → Planet Treasury → Star System Treasury
- ✅ Tribute calculations
- ✅ Balance tracking
- ✅ Multiple city/planet scenarios

#### Price Update Flow (6 tests)
- ✅ EUR price update → xBGL/USDC recalculation
- ✅ Exchange rate updates
- ✅ Purchase with new prices

#### Zone Restriction Flow (6 tests)
- ✅ Zone validation
- ✅ Building type restrictions
- ✅ Plot type restrictions

#### Plot Limit Enforcement (6 tests)
- ✅ Limit reached scenarios
- ✅ Limit exceeded prevention
- ✅ Zone-specific limits

### 3. Upgrade Tests (~20+ scenarios)

#### Storage Layout Preservation (8 tests)
- ✅ V1 → V2 upgrade for each contract
- ✅ State preservation verification
- ✅ Storage gap validation

#### Function Compatibility (8 tests)
- ✅ V1 functions work after upgrade
- ✅ New V2 functions work
- ✅ Function signature compatibility

#### Event Compatibility (4 tests)
- ✅ Old events still emit
- ✅ New events work
- ✅ Event parameter compatibility

### 4. Edge Cases and Failures (~100+ scenarios)

#### Payment Failures (15 tests)
- ✅ Insufficient funds
- ✅ Swap failures
- ✅ Slippage exceeded
- ✅ Transaction reverts
- ✅ Refund scenarios

#### Plot Limit Edge Cases (10 tests)
- ✅ 10,000th plot in zones 1-3
- ✅ 10,001st plot rejection
- ✅ Planet-wide limit scenarios

#### Building Restrictions (10 tests)
- ✅ Wrong zone building attempts
- ✅ Wrong plot type building attempts
- ✅ Capacity exceeded scenarios

#### NPC Migration Edge Cases (15 tests)
- ✅ Only job available → Migration fails
- ✅ Only housing available → Migration fails
- ✅ Capacity full → Migration fails
- ✅ Cooldown active → Migration fails

#### Exchange Rate Edge Cases (10 tests)
- ✅ Extreme rate changes
- ✅ Rate update during transaction
- ✅ Slippage protection

#### Treasury Edge Cases (10 tests)
- ✅ Tribute calculation errors
- ✅ Withdrawal failures
- ✅ Token support errors

#### Access Control (10 tests)
- ✅ Unauthorized access attempts
- ✅ Role validation
- ✅ Owner-only functions

#### State Consistency (10 tests)
- ✅ Concurrent operations
- ✅ State race conditions
- ✅ Data integrity

#### Input Validation (10 tests)
- ✅ Invalid parameters
- ✅ Zero values
- ✅ Overflow/underflow

### 5. Scenario Tests (~20+ end-to-end scenarios)

#### Complete User Journey (5 scenarios)
- ✅ Single user complete flow
- ✅ Multiple plots purchase
- ✅ Building construction
- ✅ Rental/job listing
- ✅ NPC migration

#### Multiple Users Scenario (3 scenarios)
- ✅ 10 users purchasing plots
- ✅ Building distribution
- ✅ NPC assignment distribution

#### Admin Operations (4 scenarios)
- ✅ Planet configuration
- ✅ Price management
- ✅ Exchange rate management
- ✅ System configuration

#### Treasury Revenue Scenarios (4 scenarios)
- ✅ Single city revenue flow
- ✅ Multiple cities revenue flow
- ✅ Complete hierarchy revenue flow
- ✅ Tribute tracking

#### Building Market Scenarios (4 scenarios)
- ✅ Rental market
- ✅ Job market
- ✅ NPC matching
- ✅ Capacity management

## Test Execution Plan

### Phase 1: Individual Contract Tests
- Execute all unit tests
- Verify each contract independently
- Fix any issues
- **Duration**: ~10-15 minutes

### Phase 2: Integration Tests
- Test contract interactions
- Verify data flows
- Test event emissions
- **Duration**: ~15-20 minutes

### Phase 3: Upgrade Tests
- Test upgrade scenarios
- Verify state preservation
- Test compatibility
- **Duration**: ~10-15 minutes

### Phase 4: Edge Case Tests
- Test failure scenarios
- Verify error handling
- Test boundary conditions
- **Duration**: ~15-20 minutes

### Phase 5: Scenario Tests
- Execute complete user journeys
- Test complex scenarios
- Verify system behavior
- **Duration**: ~20-30 minutes

### Phase 6: Regression Tests
- Re-run all tests after fixes
- Verify no regressions
- Final validation
- **Duration**: ~10 minutes

## Success Criteria

### Contract Tests
- ✅ All unit tests pass
- ✅ All functions work as specified
- ✅ All events emit correctly
- ✅ All state changes tracked correctly

### Integration Tests
- ✅ All contract interactions work
- ✅ Data flows correctly
- ✅ Events propagate correctly
- ✅ No data loss or corruption

### Upgrade Tests
- ✅ All upgrades succeed
- ✅ All state preserved
- ✅ All functions compatible
- ✅ No breaking changes

### Edge Case Tests
- ✅ All failure scenarios handled correctly
- ✅ All error messages clear
- ✅ All refunds processed correctly
- ✅ No funds lost in failures

### Scenario Tests
- ✅ All user journeys complete successfully
- ✅ All complex scenarios work
- ✅ System behaves correctly under load
- ✅ Performance acceptable

## Test Coverage Goals

### Target Coverage
- **Unit Tests**: 100% function coverage
- **Integration Tests**: All major flows covered
- **Upgrade Tests**: All contracts upgradable
- **Edge Cases**: All failure scenarios tested
- **Scenarios**: All user journeys tested

### Minimum Acceptable Coverage
- **Unit Tests**: 90% function coverage
- **Integration Tests**: 80% of flows covered
- **Upgrade Tests**: All critical contracts
- **Edge Cases**: Critical failure scenarios
- **Scenarios**: Major user journeys

## Test Data Requirements

### Test Accounts
- Admin account (multisig simulation)
- 10 user accounts
- 20 NPC addresses
- Treasury recipient accounts

### Test Plots
- Plots in zones 1-3 (various types)
- Plots outside zones 1-3 (various types)
- Mix of Residential, Commercial, Workshop plots

### Test Buildings
- 5 Residential buildings with rentals
- 3 Workshop buildings with jobs
- Various capacity configurations

### Test NPCs
- 20 NPC addresses
- Various states (unmigrated, migrated, employed, housed)

## Test Environment

### Sandbox Requirements
- Anvil node running locally (port 8545)
- All 16 contracts deployed
- Test accounts funded
- Test data created
- Web interface connected (optional)

### Test Execution Commands

```bash
# Run all tests
forge test

# Run specific category
forge test --match-path test/unit
forge test --match-path test/integration
forge test --match-path test/upgrade

# Run with coverage
forge coverage

# Run with gas report
forge test --gas-report
```

## Test Documentation

### Test File Structure
- Each contract has dedicated test file
- Integration tests organized by flow
- Upgrade tests per contract
- Edge cases grouped by type
- Scenarios in dedicated files

### Test Naming Convention
- Unit tests: `test[FunctionName]`
- Integration tests: `test[FlowName]Flow`
- Upgrade tests: `testUpgrade[ContractName]`
- Edge cases: `test[ErrorCase]Failure`
- Scenarios: `test[ScenarioName]Scenario`

## Continuous Testing

### Automated Testing
- Tests run on every commit
- Coverage reports generated
- Gas reports included
- Test results logged

### Manual Testing
- Web interface testing (optional)
- Interactive testing via cast
- Scenario walkthroughs
- Edge case exploration

## Test Maintenance

### Updating Tests
- Update tests when contracts change
- Add tests for new features
- Fix tests for bug fixes
- Remove obsolete tests

### Test Quality
- Clear test names
- Descriptive assertions
- Proper setup/teardown
- Isolated test cases

## Notes

- Sandbox is separate from frontend integration
- All tests focus on smart contract functionality
- Frontend integration testing will be separate phase
- Tests use mock contracts where appropriate
- Test data is generated dynamically

