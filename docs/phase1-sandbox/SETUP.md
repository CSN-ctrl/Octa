# Phase 1 Sandbox Setup Guide

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- Foundry (Forge, Anvil, Cast)
- Git
- A code editor (VS Code recommended)

### System Requirements
- Linux/macOS/Windows (WSL recommended for Windows)
- At least 4GB RAM
- 10GB free disk space

## Installation Steps

### 1. Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
anvil --version
cast --version
```

### 2. Clone/Setup Project

```bash
# Navigate to your project directory
cd /path/to/octavia-nebula-core-backup

# Create sandbox directory structure
mkdir -p forge-contracts/{src,test,script,lib}
mkdir -p forge-contracts/test/{unit,integration,upgrade,fixtures,utils}
mkdir -p forge-contracts/script/{sandbox,deploy,upgrade}
```

### 3. Initialize Foundry Project

```bash
cd forge-contracts

# Initialize Foundry project
forge init --force

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 4. Configure Foundry

Create or update `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts-upgradeable/",
    "@openzeppelin-standard/=lib/openzeppelin-contracts/"
]

solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200
via_ir = false

[profile.default.ffi]
enabled = true

[profile.default.auto_detect_solc]
version = "0.8.20"

[profile.ci]
fuzz = { runs = 10000 }
invariant = { runs = 256 }

[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true
```

### 5. Setup Remappings

Create or update `remappings.txt`:

```
@openzeppelin/=lib/openzeppelin-contracts-upgradeable/contracts/
@openzeppelin-standard/=lib/openzeppelin-contracts/contracts/
@forge-std/=lib/forge-std/src/
```

### 6. Create Environment File

Create `.env` file in `forge-contracts/`:

```env
# Anvil Configuration
ANVIL_HOST=127.0.0.1
ANVIL_PORT=8545
ANVIL_CHAIN_ID=8088

# Private Keys (Anvil default accounts - FOR TESTING ONLY)
PRIVATE_KEY_1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PRIVATE_KEY_2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Contract Addresses (will be populated after deployment)
LAND_CONTRACT=
PLOT_REGISTRY=
TREASURY=
```

## Starting the Sandbox

### 1. Start Anvil Node

```bash
# Start Anvil with specific configuration
anvil \
  --chain-id 8088 \
  --block-time 1 \
  --accounts 20 \
  --balance 10000 \
  --host 127.0.0.1 \
  --port 8545 \
  --gas-limit 30000000 \
  --base-fee 0 \
  --gas-price 0
```

Keep this terminal running. Anvil is now running on `http://127.0.0.1:8545`

### 2. Deploy Contracts

```bash
# Run deployment script
forge script script/sandbox/DeploySandbox.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -vvv
```

### 3. Verify Deployment

```bash
# Run tests to verify
forge test --rpc-url http://127.0.0.1:8545 -vvv
```

## Sandbox Interface (Optional)

If you want to use the web-based sandbox interface:

### 1. Setup Interface Dependencies

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

### 2. Connect to Sandbox

- Configure RPC URL: `http://127.0.0.1:8545`
- Chain ID: `8088`
- Use private keys from Anvil output to connect

## Configuration Files

### Anvil Startup Script

Create `scripts/start-anvil.sh`:

```bash
#!/bin/bash
anvil \
  --chain-id 8088 \
  --block-time 1 \
  --accounts 20 \
  --balance 10000 \
  --host 127.0.0.1 \
  --port 8545 \
  --gas-limit 30000000 \
  --base-fee 0 \
  --gas-price 0
```

Make it executable:
```bash
chmod +x scripts/start-anvil.sh
```

### Deployment Script

See `script/sandbox/DeploySandbox.s.sol` for complete deployment script.

## Testing the Setup

### Run Quick Test

```bash
# Run all tests
forge test --rpc-url http://127.0.0.1:8545

# Run specific test
forge test --match-test testDeployment -vvv

# Run with gas report
forge test --gas-report
```

### Verify Contracts Deployed

```bash
# Check contract code
cast code <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545

# Call view function
cast call <CONTRACT_ADDRESS> "functionName()" --rpc-url http://127.0.0.1:8545
```

## Troubleshooting

### Common Issues

**Anvil won't start:**
- Check if port 8545 is already in use
- Try different port: `anvil --port 8546`

**Contracts fail to deploy:**
- Verify Foundry is up to date: `foundryup`
- Check compiler version matches `foundry.toml`
- Ensure OpenZeppelin contracts are installed

**Tests fail:**
- Make sure Anvil is running
- Check RPC URL is correct
- Verify contract addresses are correct

### Reset Sandbox

To reset and start fresh:

```bash
# Stop Anvil (Ctrl+C)
# Restart Anvil (this clears state)
./scripts/start-anvil.sh

# Redeploy contracts
forge script script/sandbox/DeploySandbox.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key <PRIVATE_KEY> -vvv
```

## Next Steps

1. Read [Contract Specifications](./CONTRACTS.md) to understand the contracts
2. Review [Testing Guide](./TESTING.md) for test execution
3. Check [API Reference](./API.md) for function documentation
4. Follow [Deployment Guide](./DEPLOYMENT.md) for deployment instructions

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Foundry documentation: https://book.getfoundry.sh/
3. Check contract test files for examples
4. Review error messages carefully

