export type JoinEnvironment = "production" | "staging" | "dev";

const CHAIN_ID_CANDIDATES = new Set(["43113", "43114", "1337"]);

export function resolveJoinEnvironment(): JoinEnvironment {
  const explicit = process.env.NODE_JOIN_ENVIRONMENT?.trim().toLowerCase();
  if (explicit === "production" || explicit === "staging" || explicit === "dev") {
    return explicit;
  }
  const vercel = process.env.VERCEL_ENV?.trim();
  if (vercel === "production") return "production";
  if (vercel === "preview") return "staging";
  return "dev";
}

export function isProductionJoinContext(): boolean {
  return resolveJoinEnvironment() === "production";
}

export type JoinBindingContext = {
  domain: string;
  chainId: string;
  environment: JoinEnvironment;
};

export function resolveJoinBindingContext(): JoinBindingContext {
  const environment = resolveJoinEnvironment();
  const domainRaw = process.env.NODE_JOIN_DOMAIN?.trim();
  const chainRaw = process.env.NODE_JOIN_CHAIN_ID?.trim();

  if (environment === "production") {
    if (!domainRaw) {
      throw new Error("NODE_JOIN_DOMAIN must be set when Environment is production");
    }
    if (!chainRaw) {
      throw new Error("NODE_JOIN_CHAIN_ID must be set when Environment is production");
    }
  }

  const domain = (domainRaw || "http://localhost:5173").replace(/\/+$/, "");
  const chainId = chainRaw || "43113";

  if (!CHAIN_ID_CANDIDATES.has(chainId)) {
    throw new Error(`NODE_JOIN_CHAIN_ID must be one of ${[...CHAIN_ID_CANDIDATES].join(", ")}`);
  }

  return { domain, chainId, environment };
}

/** Fixed bindings for EIP-191 test vector (docs + Rust parity). */
export const DOCUMENTED_TEST_VECTOR_BINDING: JoinBindingContext = {
  domain: "https://www.sarakt.com",
  chainId: "43113",
  environment: "dev",
};
