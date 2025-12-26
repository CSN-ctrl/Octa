# Frontend and Wallet Connection Backup

This is a complete backup of the Octavia Nebula Core frontend application including all wallet connection functionality.

## Backup Date
Created: December 26, 2024
Updated: December 26, 2024 (Added logo and documents folders)

## Contents

### Source Files (src/)
- **Components** (`src/components/`): All React components including UI components, wallet connection components, and feature-specific components
- **Pages** (`src/pages/`): All page components including UnifiedUniverse, FinancialHub, DigitalID, etc.
- **Contexts** (`src/contexts/`): React contexts including WalletContext, AccountManagementContext, ChaosStarContext, etc.
- **Hooks** (`src/hooks/`): Custom React hooks for wallet, plots, treasury, portfolio, etc.
- **Lib** (`src/lib/`): Core libraries including wallet.ts, wallet-detection.ts, contracts.ts, api.ts, etc.
- **Integrations** (`src/integrations/`): Integration files for Supabase and ChaosStar

### Public Assets (public/)
- **Logo Files**: 
  - `logo.jpg` (90 KB)
  - `logo.png` (559 KB)
  - `logo.svg` (1.4 KB)
- **Other Assets**:
  - `favicon.ico`
  - `placeholder.svg`
  - `addresses.json`
  - `chaosstar-connection.json`
  - `plot-registry-address.json`
  - `robots.txt`

### Documents (documents/)
- **Land Ownership Certificates**:
  - `LandOwnershipTitleCertificate.docx` (20 KB)
  - `LandOwnershipTitleCertificate.pdf` (86 KB)

### Configuration Files
- `package.json`: All dependencies including wallet libraries (@walletconnect/ethereum-provider, ethers, etc.)
- `vite.config.ts`: Vite build configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `index.html`: HTML entry point

## Wallet Connection Features

### Core Wallet Files
1. **WalletContext.tsx** (`src/contexts/WalletContext.tsx`)
   - Main wallet context provider
   - Handles wallet connection/disconnection
   - Manages wallet state (address, signer, provider, balance)
   - Supports multiple wallet providers (MetaMask, Core Wallet, etc.)

2. **wallet.ts** (`src/lib/wallet.ts`)
   - Core wallet connection logic
   - RPC provider management
   - Network switching (ChaosStar Network)
   - WalletConnect integration (currently disabled)

3. **wallet-detection.ts** (`src/lib/wallet-detection.ts`)
   - Detects available wallet providers
   - Supports MetaMask, Core Wallet, Coinbase Wallet, Brave Wallet
   - Provides wallet selection functionality

4. **WalletConnectButton.tsx** (`src/components/WalletConnectButton.tsx`)
   - UI component for wallet connection
   - Shows available wallets in dropdown
   - Handles connection/disconnection UI

### Key Features
- Multi-wallet support (MetaMask, Core Wallet, Coinbase, Brave)
- Automatic wallet detection
- Network switching to ChaosStar Network (Chain ID: 8088)
- Balance tracking and refresh
- Account change listeners
- Chain change handlers
- Private key connection support
- WalletConnect integration (ready for re-enablement)

## Dependencies

Key wallet-related dependencies in package.json:
- `ethers`: ^6.9.0 - Ethereum library for wallet interactions
- `@walletconnect/ethereum-provider`: ^2.23.0 - WalletConnect support
- `@avalanche-sdk/chainkit`: ^0.3.0-alpha.11 - Avalanche SDK
- `@avalanche-sdk/client`: ^0.1.0-alpha.2 - Avalanche client

## Network Configuration

ChaosStar Network:
- Chain ID: 8088 (0x1F98)
- RPC URL: http://127.0.0.1:24362/ext/bc/ChaosStar/rpc
- Native Token: xBGL
- Blockchain ID: ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy

## Usage

To restore this backup:
1. Copy all files to your project directory
2. Run `npm install` to install dependencies
3. Configure environment variables in `.env` file
4. Start the development server with `npm run dev`

## Verification

✅ All files verified and tested:
- Vite server runs successfully on http://localhost:8080/
- All dependencies installed (717 packages)
- TypeScript compilation passes
- All imports resolve correctly
- Logo files and documents included

## Notes

- WalletConnect is currently disabled due to invalid project ID
- All wallet connections use direct browser wallet integration
- The backup includes all UI components, hooks, and utilities
- All configuration files are preserved
- Logo files (JPG, PNG, SVG) are included in public folder
- Land ownership certificate templates are included in documents folder
