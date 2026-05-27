/**
 * xBGL protocol constants — mirrors docs/xbgl-protocol-spec.md and on-chain XBGLToken.
 */

export const XBGL_PROTOCOL = {
  name: "Bulgarian Reserve",
  symbol: "xBGL",
  decimals: 18,
  /** Fixed genesis supply (wei): 10_000_000_000 × 10^18 */
  genesisSupplyWei: 10_000_000_000n * 10n ** 18n,
  genesisSupplyHuman: "10,000,000,000",
  network: "Avalanche C-Chain",
  deployChainId: 1337,
  /** Reserve multiplier k — recommended 2–3 (spec). */
  reserveMultiplierMin: 2,
  reserveMultiplierMax: 3,
  defaultReserveMultiplier: 2,
  /** 1 EUR issuance reference (not a peg). */
  eurToXbglRate: 1,
  isStablecoin: false,
  isRedeemable: false,
  isFiatPegged: false,
} as const;

export const XBGL_SPEC_DOC = "/docs/xbgl-protocol-spec.md";
