# ChaosStar Unified Backend

A native Go backend for the Octavia Nebula Core frontend, providing direct integration with the ChaosStar blockchain (HyperSDK-based VM).

## Features

- **Native Blockchain Integration**: Direct connection to ChaosStar VM via HyperSDK RPC
- **REST API**: Full REST API compatible with the existing frontend
- **Stargate Compatibility**: EVM-compatible RPC bridge for MetaMask
- **Complete API Coverage**: Plots, NPCs, Cities, Economy, Treasury, Governance, and more

## Quick Start

### Build

```bash
cd backend
./build.sh
```

### Run

```bash
# Run directly
go run .

# Or run the built binary
../build/chaosstar-backend
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend API port |
| `HYPER_RPC` | `http://127.0.0.1:33951/ext/bc/.../coreapi` | HyperSDK RPC endpoint |
| `STARGATE_URL` | `http://localhost:8545` | Stargate EVM RPC |
| `CHAIN_ID` | `8888` | ChaosStar chain ID |
| `BLOCKCHAIN_ID` | `22yCw5K...` | Blockchain ID |
| `FRONTEND_DIR` | `../octavia-nebula-core/dist` | Frontend static files |

## API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/status` - Backend status
- `GET /api/chain-info` - Chain information
- `GET /api/contract-info` - Contract/VM information

### Plots
- `GET /api/plots/available` - List available plots
- `GET /api/plots/owned/{address}` - List plots owned by address
- `GET /api/plots/{id}` - Get plot details
- `POST /api/plots/{id}/buy` - Purchase a plot
- `POST /api/plots/{id}/upgrade` - Upgrade a plot
- `POST /api/plots/{id}/transfer` - Transfer a plot
- `GET /api/plots/matrix` - Get octagonal matrix view

### NPCs
- `GET /api/npcs` - List all NPCs
- `GET /api/npcs/{id}` - Get NPC details
- `POST /api/npcs/spawn` - Spawn new NPCs
- `POST /api/npcs/{id}/train` - Train an NPC
- `POST /api/npcs/{id}/assign` - Assign NPC to task
- `POST /api/npcs/{id}/relocate` - Relocate an NPC
- `POST /api/npcs/evolve` - Evolve NPC traits

### Cities
- `GET /api/city` - List all cities
- `GET /api/city/{name}` - Get city details
- `POST /api/city/create` - Create a city
- `POST /api/city/{name}/economy` - Update city economy
- `GET /api/city/{name}/stats` - Get city stats

### Economy & Treasury
- `GET /api/economy/stats` - Economy statistics
- `GET /api/economy/prices` - Token prices
- `POST /api/economy/swap` - Swap tokens
- `GET /api/treasury` - Treasury information
- `POST /api/treasury/deposit` - Deposit to treasury
- `POST /api/treasury/withdraw` - Withdraw from treasury

### Balances & Transfers
- `GET /api/balance/{address}` - Get all balances
- `GET /api/balance/{address}/{token}` - Get specific token balance
- `POST /api/transfer` - Transfer tokens
- `GET /api/wallet/{address}/balance` - Wallet balance (legacy)

### Governance
- `GET /api/governance/proposals` - List proposals
- `GET /api/governance/proposal/{id}` - Get proposal details
- `POST /api/governance/proposal/create` - Create proposal
- `POST /api/governance/proposal/{id}/vote` - Vote on proposal

### Portfolio
- `GET /api/portfolio/{address}` - Get complete portfolio

### ChaosStar Specific
- `GET /api/chaosstar/matrix` - Octagonal matrix view
- `GET /api/chaosstar/balance/{address}` - Native balance
- `POST /api/chaosstar/transfer` - Native transfer
- `GET /api/chaosstar/stargate/status` - Stargate status

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                           │
│                   octavia-nebula-core                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ChaosStar Backend (Go)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Handlers   │  │  DataStore   │  │  RPC Client  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ JSON-RPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ChaosStar VM                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Actions    │  │   Storage    │  │   Stargate   │          │
│  │  (HyperSDK)  │  │              │  │   (EVM RPC)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Integration

The backend provides a TypeScript client and React hooks in the frontend:

```typescript
// Using the client directly
import { getChaosStarClient } from '@/lib/chaosstar-client';

const client = getChaosStarClient();
const plots = await client.getAvailablePlots(100, 0);

// Using React hooks
import { useAvailablePlots, usePlotActions } from '@/hooks/useChaosstar';

function PlotList() {
  const { plots, loading, error, refresh } = useAvailablePlots();
  const { buyPlot } = usePlotActions();
  
  // ...
}
```

## Comparison with Python Backend

| Feature | Python Backend | Go Backend |
|---------|---------------|------------|
| Contract Interaction | web3.py + EVM | Native HyperSDK RPC |
| Performance | Good | Excellent |
| Startup Time | ~3s | <100ms |
| Memory Usage | ~200MB | ~20MB |
| Dependencies | Many | Few |
| Blockchain Type | EVM-compatible | Native HyperSDK |

## License

Copyright (C) 2024, ChaosStar Network. All rights reserved.

