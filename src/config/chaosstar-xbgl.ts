/**

 * Canonical xBGL on ChaosStar (8888) — reference only.

 * All game contracts and in-game currency live on Avalanche 1337; see payment-network.ts.

 */



import { getChaosstarRpcUrl } from "@/config/chaosstar-network";



export type ChaosstarXbglReference = {

  /** ERC-20 on ChaosStar if deployed; null when xBGL is native-only on 8888. */

  address: string | null;

  chainId: number;

  source: "env" | "json" | "none";

};



let cached: ChaosstarXbglReference | null = null;



function parseAddress(raw: string | undefined): string | null {

  const v = raw?.trim();

  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v)) return null;

  return v;

}



/** Resolve ChaosStar xBGL contract address (for deploy lineage + docs). */

export async function resolveChaosstarXbglReference(): Promise<ChaosstarXbglReference> {

  if (cached) return cached;



  const fromEnv = parseAddress(import.meta.env.VITE_CHAOSSTAR_XBGL_ADDRESS?.toString());

  if (fromEnv) {

    cached = { address: fromEnv, chainId: 8888, source: "env" };

    return cached;

  }



  const paths = ["/chaosstar/deployments/xbgl-address.json", "/sandbox/deployments/chaosstar-xbgl.json"];

  for (const filePath of paths) {

    try {

      const res = await fetch(filePath);

      if (!res.ok) continue;

      const data = await res.json();

      const addr = parseAddress(data.address || data.xbglToken || data.XBGLToken);

      if (addr) {

        cached = { address: addr, chainId: data.chainId ?? 8888, source: "json" };

        return cached;

      }

    } catch {

      /* try next */

    }

  }



  cached = { address: null, chainId: 8888, source: "none" };

  return cached;

}



export function getChaosstarRpcUrlForDeploy(): string {

  return getChaosstarRpcUrl();

}


