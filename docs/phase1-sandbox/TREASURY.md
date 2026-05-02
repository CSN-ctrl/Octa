# Treasury System Documentation

## Overview

The Phase 1 treasury system consists of a hierarchical structure with three levels:
1. **CityTreasuryV1** - City-level treasury
2. **PlanetTreasuryV1** - Planet-level treasury
3. **StarSystemTreasuryV1** - Star system-level treasury

Revenue flows upward through the hierarchy via tribute payments.

---

## Treasury Hierarchy

```
┌─────────────────────────────────────┐
│  Star System Treasury               │
│  (Top Level)                        │
└──────────────┬──────────────────────┘
               │ Receives Tribute
               │
┌──────────────▼──────────────────────┐
│  Planet Treasury                    │
│  (Middle Level)                     │
└──────────────┬──────────────────────┘
               │ Receives Tribute
               │
┌──────────────▼──────────────────────┐
│  City Treasury                      │
│  (Base Level)                       │
└──────────────┬──────────────────────┘
               │ Collects Revenue
               │
┌──────────────▼──────────────────────┐
│  City Activities                    │
│  • Plot Sales                       │
│  • Building Rentals                 │
│  • Other Revenue Sources            │
└─────────────────────────────────────┘
```

---

## 1. CityTreasuryV1

### Purpose
Manages treasury for individual cities. Collects revenue from city activities and pays tribute to the Planet Treasury.

### Features
- Collects revenue from plot sales, building rentals, and other city activities
- Supports native tokens (xBGL) and ERC20 tokens (USDC, etc.)
- Pays tribute to Planet Treasury (configurable percentage)
- City owner/admin controlled withdrawals

### Initialization

```solidity
function initialize(
    address _owner,                    // Multisig admin
    address _cityContract,             // City contract address
    address _planetTreasury,           // Planet Treasury address
    uint256 _tributePercentage         // Tribute % in basis points (e.g., 1000 = 10%)
) public initializer
```

### Key Functions

**Deposits:**
- `deposit() payable` - Deposit native tokens (xBGL)
- `depositToken(address token, uint256 amount)` - Deposit ERC20 tokens

**Withdrawals (Owner Only):**
- `withdraw(uint256 amount)` - Withdraw native tokens
- `withdrawToken(address token, uint256 amount)` - Withdraw ERC20 tokens

**Tribute Payments:**
- `payTribute() onlyOwner` - Pay tribute to Planet Treasury

### Tribute Calculation

When `payTribute()` is called:
- Calculates tribute amount based on `tributePercentage`
- Transfers tribute to Planet Treasury
- Remaining balance stays in City Treasury

Example:
- Balance: 1000 xBGL
- Tribute Percentage: 10% (1000 basis points)
- Tribute Paid: 100 xBGL → Planet Treasury
- Remaining: 900 xBGL → City Treasury

### Integration Points

- **Plot Sales**: Receives payments from SaraktLandV2V1 (operational treasury share)
- **Building Rentals**: Receives rent payments from ResidentialBuildingV1
- **City Contract**: Linked for city-specific queries

---

## 2. PlanetTreasuryV1

### Purpose
Manages treasury for individual planets. Receives tribute from City Treasuries and pays tribute to the Star System Treasury.

### Features
- Receives tribute from multiple City Treasuries
- Supports native tokens and ERC20 tokens
- Pays tribute to Star System Treasury (configurable percentage)
- Planet owner/admin controlled withdrawals
- Tracks tribute received from each city

### Initialization

```solidity
function initialize(
    address _owner,                    // Multisig admin
    address _planetContract,           // Planet contract address
    address _starSystemTreasury,       // Star System Treasury address
    uint256 _tributePercentage         // Tribute % in basis points
) public initializer
```

### Key Functions

**Receiving Tribute:**
- `receiveTribute(address cityTreasury, uint256 amount) payable` - Receive native token tribute
- `receiveTributeToken(address cityTreasury, address token, uint256 amount)` - Receive ERC20 token tribute

**Withdrawals (Owner Only):**
- `withdraw(uint256 amount)` - Withdraw native tokens
- `withdrawToken(address token, uint256 amount)` - Withdraw ERC20 tokens

**Tribute Payments:**
- `payTribute() onlyOwner` - Pay tribute to Star System Treasury

### Tribute Tracking

The contract tracks tribute received from each city:
- `cityTributes[cityTreasury]` - Total tribute received from a specific city
- Useful for analytics and auditing

### Tribute Flow Example

```
City Treasury A: Pays 100 xBGL tribute
    ↓
Planet Treasury: Receives 100 xBGL, tracks in cityTributes[A]
    ↓
Planet Treasury: Pays 10% (10 xBGL) to Star System Treasury
    ↓
Planet Treasury: Remaining 90 xBGL stays in Planet Treasury
```

### Integration Points

- **City Treasuries**: Multiple cities pay tribute
- **Planet Contract**: Linked for planet-specific queries
- **Star System Treasury**: Pays tribute upward

---

## 3. StarSystemTreasuryV1

### Purpose
Manages treasury for star systems. Receives tribute from Planet Treasuries. This is the top level of the treasury hierarchy.

### Features
- Receives tribute from multiple Planet Treasuries
- Supports native tokens and ERC20 tokens
- Star system owner/admin controlled withdrawals
- Tracks tribute received from each planet

### Initialization

```solidity
function initialize(
    address _owner,                    // Multisig admin
    address _starSystemContract        // Star System contract address
) public initializer
```

### Key Functions

**Receiving Tribute:**
- `receiveTribute(address planetTreasury, uint256 amount) payable` - Receive native token tribute
- `receiveTributeToken(address planetTreasury, address token, uint256 amount)` - Receive ERC20 token tribute

**Withdrawals (Owner Only):**
- `withdraw(uint256 amount)` - Withdraw native tokens
- `withdrawToken(address token, uint256 amount)` - Withdraw ERC20 tokens

### Tribute Tracking

The contract tracks tribute received from each planet:
- `planetTributes[planetTreasury]` - Total tribute received from a specific planet
- Useful for analytics and auditing

### Integration Points

- **Planet Treasuries**: Multiple planets pay tribute
- **Star System Contract**: Linked for star system-specific queries

---

## Revenue Flow Example

### Complete Flow: Plot Sale

1. **User purchases plot** for 100 EUR
   - Calculated as ~195.58 xBGL (at 1.955833 rate)
   - User pays 110 USDC (auto-swapped to xBGL)

2. **Payment routing** (in SaraktLandV2V1):
   - 33% (64.54 xBGL) → Reserve Treasury (SaraktTreasuryV1)
   - 67% (131.04 xBGL) → Operational Treasury → City Treasury

3. **City Treasury** receives 131.04 xBGL
   - Balance: 131.04 xBGL

4. **City pays tribute** (10% = 13.10 xBGL)
   - Tribute to Planet Treasury: 13.10 xBGL
   - Remaining in City Treasury: 117.94 xBGL

5. **Planet Treasury** receives 13.10 xBGL
   - Balance: 13.10 xBGL
   - Tracks: `cityTributes[cityTreasury] += 13.10`

6. **Planet pays tribute** (10% = 1.31 xBGL)
   - Tribute to Star System Treasury: 1.31 xBGL
   - Remaining in Planet Treasury: 11.79 xBGL

7. **Star System Treasury** receives 1.31 xBGL
   - Balance: 1.31 xBGL
   - Tracks: `planetTributes[planetTreasury] += 1.31`

### Summary

From 195.58 xBGL plot sale:
- Reserve Treasury: 64.54 xBGL (33%)
- City Treasury: 117.94 xBGL (60.3%)
- Planet Treasury: 11.79 xBGL (6.0%)
- Star System Treasury: 1.31 xBGL (0.7%)

---

## Tribute Percentage Configuration

### Default Configuration (Recommended)

- **City → Planet**: 10% (1000 basis points)
- **Planet → Star System**: 10% (1000 basis points)

### Custom Configuration

Tribute percentages can be configured per treasury:
- Different cities can have different tribute rates
- Different planets can have different tribute rates
- Percentages stored in basis points (1000 = 10%, 500 = 5%)

### Updating Tribute Percentages

Only contract owners (multisig) can update tribute percentages:
- Requires governance approval
- Affects all future tribute payments
- Historical tribute tracking remains unchanged

---

## Treasury Balances

### Viewing Balances

Each treasury contract provides view functions:
```solidity
// View native token balance
address(treasury).balance

// View ERC20 token balance
treasury.balances[tokenAddress]

// View supported tokens
treasury.supportedTokens[tokenAddress]
```

### Balance Tracking

All treasuries track:
- Native token balance (xBGL)
- ERC20 token balances (USDC, etc.)
- Tribute received (for Planet and Star System treasuries)

---

## Access Control

### Admin Functions

All treasury contracts use `onlyOwner` for:
- Withdrawals
- Tribute payments
- Configuration updates

### Multisig Requirement

All `onlyOwner` functions require:
- Multisig wallet approval (3-of-5 or 4-of-7)
- Air-gapped security (keys stored offline)
- Timelock for significant changes (optional)

---

## Events

### CityTreasuryV1 Events
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`
- `TributePaid(address indexed planetTreasury, uint256 amount)`

### PlanetTreasuryV1 Events
- `TributeReceived(address indexed cityTreasury, uint256 amount)`
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`
- `TributePaid(address indexed starSystemTreasury, uint256 amount)`

### StarSystemTreasuryV1 Events
- `TributeReceived(address indexed planetTreasury, uint256 amount)`
- `Deposit(address indexed from, address indexed token, uint256 amount)`
- `Withdrawal(address indexed to, address indexed token, uint256 amount)`

---

## Security Considerations

### Fund Safety
- All treasuries use multisig for withdrawals
- Air-gapped keys for admin functions
- Timelock for large withdrawals (optional)
- Pausable functionality for emergency stops

### Tribute Validation
- Tribute percentages validated (0-100% range)
- Tribute amounts validated before transfer
- Failed tribute payments don't affect treasury balance

### Integration Security
- All external calls validated
- Reentrancy guards on payable functions
- Access control on all state-changing functions

---

## Testing Scenarios

### Test Case 1: Revenue Collection
1. Plot sale → City Treasury receives payment
2. Verify balance increased
3. Verify event emitted

### Test Case 2: Tribute Payment (City → Planet)
1. City Treasury pays tribute
2. Verify Planet Treasury received tribute
3. Verify City Treasury balance decreased
4. Verify `cityTributes` tracking updated

### Test Case 3: Tribute Payment (Planet → Star System)
1. Planet Treasury pays tribute
2. Verify Star System Treasury received tribute
3. Verify Planet Treasury balance decreased
4. Verify `planetTributes` tracking updated

### Test Case 4: Complete Revenue Flow
1. Plot sale → City Treasury
2. City pays tribute → Planet Treasury
3. Planet pays tribute → Star System Treasury
4. Verify all balances correct
5. Verify all tracking updated

### Test Case 5: Multiple Cities/Planets
1. Multiple cities pay tribute to Planet Treasury
2. Multiple planets pay tribute to Star System Treasury
3. Verify all tributes tracked separately
4. Verify total balances correct

---

## Future Enhancements

### Potential Features
- Automatic tribute payments (scheduled)
- Multi-token tribute support
- Treasury analytics dashboard
- Revenue sharing with token holders
- Treasury governance (DAO voting)

### Integration Opportunities
- NFT marketplace revenue
- Building rental revenue
- Service fees
- Tax collection

