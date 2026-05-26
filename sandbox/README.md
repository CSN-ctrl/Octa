# Avalanche 1337 — game contracts sandbox

All **smart contracts** deploy to **Avalanche local C-Chain (chain 1337)**.  
**ChaosStar (8888)** only supplies the **canonical xBGL contract address** (reference) — not land/treasury/game logic.

## Architecture

| Network | Role |
|---------|------|
| **ChaosStar 8888** | xBGL reference address (`CHAOSSTAR_XBGL_ADDRESS` or `chaosstar/deployments/xbgl-address.json`) |
| **Avalanche 1337** | `XBGLToken`, `SaraktLandV2`, treasury, digital ID — **in-game currency** |

Flow: resolve ChaosStar xBGL address → deploy stack on 1337 → wire `land.setUSDC(xBGL)` + `phase1PriceUSDC` → app reads `sandbox/deployments/1337-latest.json`.

## Setup

```powershell
copy sandbox\.env.example sandbox\.env
# Set XBGL_DEPLOYER_PRIVATE_KEY (needs AVAX on 1337)
# Optional: CHAOSSTAR_XBGL_ADDRESS=0x... from ChaosStar subnet
```

Optional ChaosStar reference file:

```powershell
copy chaosstar\deployments\xbgl-address.json.example chaosstar\deployments\xbgl-address.json
# Edit address after xBGL ERC-20 exists on ChaosStar
```

## Deploy

```powershell
npm run sandbox:deploy
```

Writes:

- `sandbox/deployments/1337-latest.json`
- `public/sandbox/deployments/1337-latest.json` (for Vite)

Then copy printed `VITE_*` lines into `.env.local`.

## Commands

| Command | What it does |
|---------|----------------|
| `npm run sandbox:deploy` | Full stack on 1337 + ChaosStar xBGL reference |
| `npm run sandbox:test` | Foundry unit tests |
| `npm run sandbox:smoke` | On-chain smoke tests |

## Frontend env

```env
VITE_ONCHAIN_CRYPTO=true
VITE_CHAOSSTAR_CHAIN_ID=8888
VITE_CHAOSSTAR_RPC=/chaosstar-rpc
VITE_CHAIN_ID=1337
VITE_AVALANCHE_RPC=/avax-rpc
VITE_XBGL_TOKEN_ADDRESS=<from 1337-latest.json>
VITE_CONTRACT_ADDRESS=<SaraktLandV2>
VITE_CHAOSSTAR_XBGL_ADDRESS=<optional reference from 8888>
```
