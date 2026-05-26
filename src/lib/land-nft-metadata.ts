/** Shared land plot NFT image + ERC-1155 metadata helpers (dashboard plot card art). */

export const LAND_NFT_IMAGE_PATH = "/plot-preview.png";

/** EIP-1155 metadata URI `{id}` substitution: 64-char lowercase hex, no 0x prefix. */
export function erc1155TokenIdHex(plotId: number): string {
  return plotId.toString(16).padStart(64, "0");
}

export function parsePlotIdFromMetadataPath(segment: string): number | null {
  const base = segment.replace(/\.json$/i, "");
  if (/^\d+$/.test(base)) {
    const n = Number(base);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (/^[0-9a-f]{64}$/i.test(base)) {
    const n = parseInt(base, 16);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

export function getLandNftImageUrl(origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");
  return `${base.replace(/\/$/, "")}${LAND_NFT_IMAGE_PATH}`;
}

export function getLandMetadataBaseUri(origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");
  return `${base.replace(/\/$/, "")}/metadata/land/{id}.json`;
}

export function buildLandPlotMetadata(plotId: number, origin?: string) {
  const image = getLandNftImageUrl(origin);
  return {
    name: `ChaosStar Plot #${plotId}`,
    description:
      "Sarakt land plot on ChaosStar. Zone and value are shown in the Octa dashboard.",
    image,
    external_url: origin ? `${origin.replace(/\/$/, "")}/land-test` : undefined,
    attributes: [
      { trait_type: "Plot ID", value: plotId },
      { trait_type: "Type", value: "Land Plot" },
    ],
  };
}
