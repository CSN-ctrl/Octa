export type JoinEnvironment = "production" | "staging" | "dev";

const CHAIN_ID_CANDIDATES = new Set(["43113", "43114", "1337"]);

export class JoinContextUnconfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JoinContextUnconfiguredError";
  }
}

export function resolveJoinEnvironment(): JoinEnvironment {
  const explicit = process.env.NODE_JOIN_ENVIRONMENT?.trim().toLowerCase();
  if (explicit === "production") return "production";
  if (explicit === "staging") return "staging";
  if (explicit === "dev" || explicit === "development") return "dev";

  const vercel = process.env.VERCEL_ENV?.trim();
  if (vercel === "production") return "production";
  if (vercel === "preview") return "staging";

  throw new JoinContextUnconfiguredError("NODE_JOIN_ENVIRONMENT or VERCEL_ENV must be set");
}

export function isProductionJoinContext(): boolean {
  return resolveJoinEnvironment() === "production";
}

export function isDevelopmentJoinContext(): boolean {
  return resolveJoinEnvironment() === "dev";
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
      throw new JoinContextUnconfiguredError("NODE_JOIN_DOMAIN must be set when Environment is production");
    }
    if (!chainRaw) {
      throw new JoinContextUnconfiguredError("NODE_JOIN_CHAIN_ID must be set when Environment is production");
    }
  }

  const domain =
    environment === "dev"
      ? (domainRaw || "http://localhost:8080").replace(/\/+$/, "")
      : (domainRaw || "").replace(/\/+$/, "");
  const chainId = chainRaw || (environment === "dev" ? "43113" : "");

  if (environment !== "dev" && !chainRaw) {
    throw new JoinContextUnconfiguredError("NODE_JOIN_CHAIN_ID must be set for this environment");
  }

  if (!CHAIN_ID_CANDIDATES.has(chainId)) {
    throw new JoinContextUnconfiguredError(
      `NODE_JOIN_CHAIN_ID must be one of ${[...CHAIN_ID_CANDIDATES].join(", ")}`,
    );
  }

  return { domain, chainId, environment };
}

export function assertJoinContextConfigured(): { ok: true } | { ok: false; message: string } {
  try {
    resolveJoinBindingContext();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Fixed bindings for EIP-191 test vector (docs + Rust parity). */
export const DOCUMENTED_TEST_VECTOR_BINDING: JoinBindingContext = {
  domain: "https://www.sarakt.com",
  chainId: "43113",
  environment: "dev",
};
