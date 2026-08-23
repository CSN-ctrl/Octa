import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LAND = "0x60fe424140720400815f068938e473e0a572b282";
const TREASURY = "0x5b468dfa4cdbd11d307fc0221e80ac3e2a50b284";
const RETIRED_LAND = "0xc34a5fcb5621b7755d66db5074069d0bbd68cd42";
const RETIRED_TREASURY = "0xee0ba6de15026d00a707a660123c93686c00df58";
const START_BLOCK = 57793346;

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Fuji indexer stack cutover", () => {
  it("keeps sandbox and public manifests on the 2026-08-16 stack", () => {
    for (const rel of [
      "sandbox/deployments/43113-latest.json",
      "public/sandbox/deployments/43113-latest.json",
    ]) {
      const manifest = JSON.parse(read(rel)) as {
        deployBlock: number;
        contracts: { SaraktLandV2: string; SaraktTreasury: string };
        params: { salesActive: boolean };
      };
      expect(manifest.deployBlock).toBe(START_BLOCK);
      expect(manifest.contracts.SaraktLandV2.toLowerCase()).toBe(LAND);
      expect(manifest.contracts.SaraktTreasury.toLowerCase()).toBe(TREASURY);
      expect(manifest.params.salesActive).toBe(true);
    }
  });

  it("points ingest defaults at the new stack and refuses retired addresses", () => {
    const deposits = read("supabase/functions/ingest-fuji-deposits/index.ts");
    const land = read("supabase/functions/ingest-fuji-land-transfers/index.ts");

    expect(deposits).toContain(`const DEFAULT_TREASURY_ADDRESS = "${TREASURY}"`);
    expect(deposits).toContain(`const DEFAULT_FUJI_START_BLOCK = ${START_BLOCK}`);
    expect(deposits).toContain(`const RETIRED_FUJI_TREASURY = "${RETIRED_TREASURY}"`);

    expect(land).toContain(`const DEFAULT_LAND_ADDRESS = "${LAND}"`);
    expect(land).toContain(`const DEFAULT_FUJI_LAND_START_BLOCK = ${START_BLOCK}`);
    expect(land).toContain(`const RETIRED_FUJI_LAND = "${RETIRED_LAND}"`);
  });

  it("points the subgraph at the new stack start block", () => {
    const yaml = read("subgraph/subgraph.yaml");
    expect(yaml.toLowerCase()).toContain(LAND);
    expect(yaml.toLowerCase()).toContain(TREASURY);
    expect(yaml).toContain(`startBlock: ${START_BLOCK}`);
    expect(yaml.toLowerCase()).not.toContain(RETIRED_LAND);
    expect(yaml.toLowerCase()).not.toContain(RETIRED_TREASURY);
  });
});
