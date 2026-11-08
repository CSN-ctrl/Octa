# SaraktNetwork (Avalanche L1)

Production Sarakt subnet identifiers (redeploy **2026-11**). **Chain ID `8890` is unchanged** across redeploys.

| Field | Value |
|-------|--------|
| Network name | SaraktNetwork |
| Chain ID | `8890` |
| Subnet ID | `8eKB9FkkhuWN9gWGEQ2GLev6kfRZPSzu8EviAwahUbD4MDBK9` |
| Blockchain ID | `xg5VhR6SKocvvgHptzUwqUmfBGfgeeze5YncLg4ZmeAPWLi7B` |
| Validator (Bulgarian) | `NodeID-6shjfdtMfD78BnnNe8xVRwfftzMnRu2sb` |
| Validator (Sarakt) | `NodeID-6K7AkQTQFdE57zHUDGLLZBhpR52NxkyUB` |

EVM JSON-RPC path (replace host/port with your validator or API gateway):

```text
https://<host>/ext/bc/xg5VhR6SKocvvgHptzUwqUmfBGfgeeze5YncLg4ZmeAPWLi7B/rpc
```

Canonical TypeScript constants: `src/config/sarakt-network.ts`.

**Do not confuse with Phase 1 Fuji pilot (`43113`)** — treasury/land contracts and `NODE_JOIN_CHAIN_ID` pilot default remain on Fuji unless product explicitly moves join SIWE to `8890`.

### Previous blockchain IDs (obsolete)

- `Yy9YBphs5ThMEqo4eQZHW2TLXKqtXqVZY1yFzxf9tfWrFJxrJ` (`.env.example` legacy RPC comment)
- `ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy` (former `VITE_BLOCKCHAIN_ID` default)
- `wtHFpLKd93iiPmBBsCdeTEPz6Quj9MoCL8NpuxoFXHtvTVeT1` (local stargate mock RPC in UI dev paths)
