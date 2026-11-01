import type { ApiRequest } from "./types";
import {
  isProductionJoinContext,
  resolveJoinBindingContext,
  resolveJoinEnvironment,
  type JoinBindingContext,
} from "./node-join-context";
import { siweDomainAndUri } from "./node-siwe";

export type JoinHostResolution =
  | { ok: true; host: string; origin: string; binding: JoinBindingContext }
  | { ok: false; error: "domain_not_allowed" | "join_context_unconfigured"; message?: string };

function headerValue(req: ApiRequest, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** Host header as seen on this deployment (Vercel-controlled forwarded host when on Vercel). */
export function requestHostHeader(req: ApiRequest): string | null {
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV?.trim());
  let host: string | undefined;
  if (onVercel) {
    host =
      headerValue(req, "x-vercel-forwarded-host") ||
      headerValue(req, "x-forwarded-host") ||
      headerValue(req, "host");
  } else {
    host = headerValue(req, "host");
  }
  if (!host) return null;
  return host.trim().toLowerCase();
}

export function hostFromJoinDomain(joinDomain: string): string {
  const { uri } = siweDomainAndUri(joinDomain);
  try {
    return new URL(uri).host.toLowerCase();
  } catch {
    const { domain } = siweDomainAndUri(joinDomain);
    return domain.toLowerCase();
  }
}

export function originFromHost(host: string): string {
  const override = process.env.NODE_JOIN_SITE_ORIGIN?.trim().replace(/\/+$/, "");
  if (override) {
    try {
      const u = new URL(override.includes("://") ? override : `https://${override}`);
      if (u.host.toLowerCase() === host.toLowerCase()) {
        return u.origin;
      }
    } catch {
      /* fall through */
    }
  }
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const scheme = isLocal ? "http" : "https";
  return `${scheme}://${host}`;
}

function parseHostFromEnvUrl(url: string): string | null {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.host.toLowerCase();
  } catch {
    return null;
  }
}

export function devJoinHostsAllowlist(): string[] {
  const raw = process.env.NODE_JOIN_DEV_HOSTS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["localhost:8080", "127.0.0.1:8080"];
}

/** Dot-separated labels; each label is literal or exactly `*` (one DNS label). */
export function matchPreviewHostPattern(pattern: string, host: string): boolean {
  const pat = pattern.trim().toLowerCase();
  const h = host.trim().toLowerCase();
  if (!pat || !h) return false;
  const labels = pat.split(".");
  const hostLabels = h.split(".");
  if (labels.length !== hostLabels.length) return false;
  for (let i = 0; i < labels.length; i++) {
    const pl = labels[i]!;
    const hl = hostLabels[i]!;
    if (pl === "*") {
      if (!hl) return false;
      continue;
    }
    if (pl.includes("*")) {
      const parts = pl.split("*");
      if (parts.length !== 2) return false;
      const [prefix, suffix] = parts;
      if (!hl.startsWith(prefix) || !hl.endsWith(suffix) || hl.length <= prefix.length + suffix.length) {
        return false;
      }
      const middle = hl.slice(prefix.length, hl.length - suffix.length);
      if (!middle || middle.includes(".")) return false;
      continue;
    }
    if (pl !== hl) return false;
  }
  return true;
}

function previewAllowlistHosts(): string[] {
  const hosts: string[] = [];
  for (const key of ["VERCEL_URL", "VERCEL_BRANCH_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    const h = parseHostFromEnvUrl(raw.startsWith("http") ? raw : `https://${raw}`);
    if (h) hosts.push(h);
  }
  return hosts;
}

export function isHostAllowlistedForJoin(host: string): boolean {
  const h = host.trim().toLowerCase();
  if (!h) return false;

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const environment = resolveJoinEnvironment();

  if (vercelEnv === "production" || (environment === "production" && vercelEnv !== "preview")) {
    const domainRaw = process.env.NODE_JOIN_DOMAIN?.trim();
    if (!domainRaw) return false;
    const prodHost = parseHostFromEnvUrl(domainRaw);
    return prodHost === h;
  }

  if (vercelEnv === "preview" || environment === "staging") {
    const pattern = process.env.NODE_JOIN_PREVIEW_HOST_PATTERN?.trim();
    if (pattern && matchPreviewHostPattern(pattern, h)) {
      return true;
    }
    const listed = previewAllowlistHosts();
    if (listed.includes(h)) {
      return true;
    }
    return false;
  }

  return devJoinHostsAllowlist().includes(h);
}

export function resolveJoinBindingFromRequest(req: ApiRequest): JoinHostResolution {
  let chainBinding: JoinBindingContext;
  try {
    chainBinding = resolveJoinBindingContext();
  } catch (e) {
    return { ok: false, error: "join_context_unconfigured", message: (e as Error).message };
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim();

  if (vercelEnv === "production" || (isProductionJoinContext() && vercelEnv !== "preview")) {
    const domainRaw = process.env.NODE_JOIN_DOMAIN?.trim();
    if (!domainRaw) {
      return {
        ok: false,
        error: "join_context_unconfigured",
        message: "NODE_JOIN_DOMAIN must be set in production",
      };
    }
    const prodHost = parseHostFromEnvUrl(domainRaw);
    if (!prodHost) {
      return { ok: false, error: "join_context_unconfigured", message: "Invalid NODE_JOIN_DOMAIN" };
    }
    const reqHost = requestHostHeader(req);
    if (reqHost !== prodHost) {
      return { ok: false, error: "domain_not_allowed" };
    }
    const origin = domainRaw.replace(/\/+$/, "");
    return {
      ok: true,
      host: prodHost,
      origin: origin.includes("://") ? new URL(origin).origin : `https://${prodHost}`,
      binding: { ...chainBinding, domain: origin.includes("://") ? origin : `https://${prodHost}` },
    };
  }

  const host = requestHostHeader(req);
  if (!host) {
    return { ok: false, error: "domain_not_allowed" };
  }
  if (!isHostAllowlistedForJoin(host)) {
    return { ok: false, error: "domain_not_allowed" };
  }

  const origin = originFromHost(host);
  return {
    ok: true,
    host,
    origin,
    binding: { ...chainBinding, domain: origin },
  };
}

export function approveUrlForChallenge(origin: string, challengeId: string): string {
  const siteOverride = process.env.NODE_JOIN_SITE_ORIGIN?.trim().replace(/\/+$/, "");
  const base = siteOverride || origin;
  const normalized = base.includes("://") ? base : `https://${base}`;
  return `${normalized.replace(/\/+$/, "")}/run-a-node/approve?challenge=${challengeId}`;
}

export function challengeBindingMatchesServer(
  challenge: {
    join_domain: string;
    chain_id: string;
    join_environment: string;
  },
  req?: ApiRequest,
): boolean {
  try {
    const server = resolveJoinBindingContext();
    if (challenge.chain_id !== server.chainId) return false;
    if (challenge.join_environment !== server.environment) return false;

    const challengeHost = hostFromJoinDomain(challenge.join_domain);
    if (!isHostAllowlistedForJoin(challengeHost)) {
      return false;
    }

    if (req) {
      const resolved = resolveJoinBindingFromRequest(req);
      if (!resolved.ok) return false;
      const expectedHost = hostFromJoinDomain(resolved.binding.domain);
      if (expectedHost !== challengeHost) return false;
    }

    return true;
  } catch {
    return false;
  }
}
