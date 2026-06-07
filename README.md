# ChaosStar

ChaosStar is the application layer for Sarakt, a World-as-a-Service (WaaS) platform where users own and evolve digital worlds across land, city, planet, and solar-system scales.

For the latest product narrative and system model, see `docs/sarakt-waas.md`.

## Features

- **Wallet Integration**: Multi-wallet support (MetaMask, Core Wallet, Coinbase, Brave)
- **Financial Hub**: Portfolio management, asset tracking, and purchase history
- **Digital ID**: Identity management system
- **Universe Visualization**: Interactive 3D visualization of star systems and planets
- **Plot Registry**: Land plot management and trading
- **Treasury Management**: Token and asset management

## Network Configuration

**Phase 1 (production default): Avalanche Fuji C-Chain**
- Chain ID: **43113** (0xA869)
- RPC URL: `https://api.avax-test.network/ext/bc/C/rpc` (or Alchemy Fuji)
- Native gas token: **AVAX**
- In-game currency: **xBGL** ERC-20 on Fuji — deploy with `npm run sandbox:deploy:fuji`, wire addresses from `sandbox/deployments/43113-latest.json`
- Default env: `VITE_CHAIN_ID=43113`, `VITE_ONCHAIN_CRYPTO=true`

**ChaosStar (8888):** optional wallet/branding RPC only — not the Phase 1 payment rail.

**Local sandbox (1337):** optional Foundry/Hardhat dev chain — use when iterating contracts locally.

Production cutover: `docs/ops/fuji-production-cutover.md`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## License

See LICENSE file for details.

