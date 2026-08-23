# ChaosStar Subgraph — Goldsky Deployment

Indexes two contracts on **Avalanche Fuji (43113)**:

| Contract | Address | Events indexed |
|---|---|---|
| `SaraktLandV2` | `0x60fe424140720400815f068938e473e0a572b282` | `TransferSingle` |
| `SaraktTreasury` | `0x5b468dfa4cdbd11d307fc0221e80ac3e2a50b284` | `AvaxSwappedForXbgl` |

## Entities

- **PlotTransfer** — every ERC-1155 `TransferSingle` event (mints, transfers, burns)
- **AvaxDeposit** — every AVAX→xBGL swap through the treasury

---

## Prerequisites

```bash
# Install Goldsky CLI (requires Node 18+)
curl https://goldsky.com/install | sh

# Authenticate
goldsky login
```

Also install The Graph CLI for local codegen:

```bash
npm install -g @graphprotocol/graph-cli
```

---

## Local Setup & Codegen

```bash
cd subgraph

# Install Graph node dependencies (package.json not committed — init first)
graph init --product hosted-service --from-contract \
  --network avalanche-fuji \
  --contract-name SaraktLandV2 \
  --abi abis/SaraktLandV2.json \
  0x60fe424140720400815f068938e473e0a572b282

# Or just run codegen against the existing subgraph.yaml
graph codegen subgraph.yaml --output-dir generated/

# Type-check mapping files
graph build subgraph.yaml
```

---

## Deploy to Goldsky

```bash
# Set deployment name and version
SUBGRAPH_NAME="chaosStar-fuji"
VERSION="v1"

# Deploy (Goldsky wraps `graph deploy` internally)
goldsky subgraph deploy ${SUBGRAPH_NAME}/${VERSION} \
  --path .

# Check status
goldsky subgraph list

# View endpoint
goldsky subgraph endpoint ${SUBGRAPH_NAME}/${VERSION}
```

Goldsky returns a GraphQL endpoint of the form:
```
https://api.goldsky.com/api/public/<project-id>/subgraphs/<name>/<version>/gn
```

---

## Updating startBlock

Before deploying to a new network or after re-deploying contracts, update `startBlock` in
`subgraph.yaml` to the actual contract deployment block number to avoid scanning from genesis:

```bash
# Get the block number from the deploy transaction hash
cast tx <DEPLOY_TX_HASH> blockNumber \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```

Then update `startBlock` in `subgraph.yaml` for both data sources.

---

## Useful GraphQL Queries

```graphql
# Latest plot transfers (mints)
{
  plotTransfers(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { from: "0x0000000000000000000000000000000000000000" }
  ) {
    id
    plotId
    to
    timestamp
    transactionHash
  }
}

# AVAX deposits by buyer
{
  avaxDeposits(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { buyer: "<buyer-address>" }
  ) {
    id
    avaxIn
    xbglOut
    timestamp
    transactionHash
  }
}
```

---

## Files

```
subgraph/
├── abis/
│   ├── SaraktLandV2.json      # ERC-1155 events ABI
│   └── SaraktTreasury.json    # Treasury events ABI
├── src/
│   ├── saraktLandV2.ts        # TransferSingle handler
│   └── saraktTreasury.ts      # AvaxSwappedForXbgl handler
├── generated/                 # codegen output (git-ignored)
├── schema.graphql             # GraphQL entity definitions
├── subgraph.yaml              # Subgraph manifest
└── README.md                  # This file
```
