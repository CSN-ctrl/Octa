# Fuji staging ops runbook

Fuji (`43113`) only. Use after hardened redeploy + Safe ownership (see `fuji-staging-checklist.md`).

## 1. Set AVAX→xBGL rate

Owner (Safe) calls Treasury:

```bash
RPC=https://api.avax-test.network/ext/bc/C/rpc
# rateE18 = xBGL wei per 1 AVAX (18 decimals), e.g. 16.68e18
cast send $VITE_TREASURY_ADDRESS "setXbglPerAvax(uint256)" <rateE18> \
  --rpc-url $RPC  # via Safe UI in staging
cast call $VITE_TREASURY_ADDRESS "xbglPerAvaxE18()(uint256)" --rpc-url $RPC
```

Policy: update when EUR/USD/AVAX bridge moves; record tx hash in ops log.

## 2. Pause kill-switch

**Pause both Land and Treasury** for a full stop (ERC-20 buys ignore Treasury-only pause).

```text
Land.pause()
Treasury.pause()
```

While paused:
- Buys + `depositAvaxForXbgl` + `depositERC20` + `receive` blocked
- `withdrawAVAX` / `withdrawERC20` still work (emergency drain)

Unpause both when clear:

```text
Land.unpause()
Treasury.unpause()
```

## 3. Sales toggle

```text
Land.toggleSales(true|false)
```

Deploy default is **false**. Enable only after rate set + Safe owns contracts + smoke passed.

## 3b. Admin plot reset (testnet only)

Free a sold plot for resale (burns NFT, clears treasury registry). **Paused + owner only.** Reverts on chain `43114`.

```bash
npm run sandbox:free-test:fuji -- reset <plotId> <holder>
# or manually:
RPC=https://api.avax-test.network/ext/bc/C/rpc
cast send $VITE_CONTRACT_ADDRESS "pause()" --private-key $PK --rpc-url $RPC
cast send $VITE_CONTRACT_ADDRESS "adminResetPlot(uint256,address)" <plotId> <holder> \
  --private-key $PK --rpc-url $RPC
cast send $VITE_CONTRACT_ADDRESS "unpause()" --private-key $PK --rpc-url $RPC
```

No purchase refund — staging helper only.

## 3c. Free-test kit (Fuji / local only)

Owner helpers so you can QA without chasing AVAX or plot inventory:

| Command | What it does |
|---|---|
| `adminGrantPlot(to, plotId)` | Free mint + treasury register at 0 price (no pause needed) |
| `adminResetPlot(plotId, holder)` | Burn + free id (requires pause) |
| `adminClearPendingBuyer(plotId)` | Unstick a pending activation slot |
| `toggleSales` / `pause` / `unpause` | Sales + kill-switch |

CLI (reads `sandbox/deployments/43113-latest.json` + `FUJI_PRIVATE_KEY`):

```bash
npm run sandbox:free-test:fuji -- status
npm run sandbox:free-test:fuji -- sales on
npm run sandbox:free-test:fuji -- grant 77                 # mint to operator
npm run sandbox:free-test:fuji -- grant 77 0xYourWallet
npm run sandbox:free-test:fuji -- reset 77 0xHolder
npm run sandbox:free-test:fuji -- loop 77                  # grant→reset→grant
npm run sandbox:free-test:fuji -- seed-xbgl 0xWallet 1000  # transfer genesis xBGL
```

All admin* helpers revert on Avalanche mainnet chain id `43114`.

## 4. Metadata URI

```bash
npm run sandbox:set-metadata-uri
# or
cast send $VITE_CONTRACT_ADDRESS "setMetadataURI(string)" \
  "https://www.sarakt.com/metadata/land/{id}.json" --rpc-url $RPC
```

Confirm `{id}` resolves over HTTPS.

## 5. Smoke

```bash
npm run sandbox:smoke:fuji
```

Expect: deposit AVAX→xBGL → approve → `buyPlotWithUSDC` (pick unused plot id).

## 6. Indexer health

Manual triggers:

```bash
curl -X POST https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-deposits
curl -X POST https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-land-transfers
```

SQL:

```sql
SELECT * FROM treasury_ingest_checkpoints;
SELECT status, COUNT(*) FROM onchain_deposits GROUP BY 1;
SELECT COUNT(*) FROM chain_plot_holdings;
```

After redeploy, set `FUJI_START_BLOCK` / `FUJI_LAND_START_BLOCK` to the new deploy block (see Routescan first contract tx).

## 7. Monitoring checklist

- [ ] `salesActive` / `paused` on Land + Treasury
- [ ] `xbglPerAvaxE18` non-zero when deposits open
- [ ] Treasury AVAX + xBGL balances
- [ ] Indexer checkpoint lag
- [ ] Failed edge-function logs

## 8. npm scripts

| Script | Purpose |
|---|---|
| `sandbox:deploy:fuji` | Redeploy hardened stack |
| `sandbox:verify:fuji` | On-chain status probe |
| `sandbox:transfer:safe` | Ownable → Safe (Fuji-only) |
| `sandbox:smoke:fuji` | Deposit + buy smoke |
| `sandbox:set-metadata-uri` | Metadata template |
| `forge:test:fuji-access` | Access/pause Foundry suite |
