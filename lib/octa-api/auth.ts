type HeaderBag = Record<string, string | string[] | undefined>;

export function getBearerToken(req: { headers: HeaderBag }): string | null {
  const raw =
    req.headers.authorization ??
    req.headers.Authorization ??
    req.headers["authorization"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("Bearer ")) {
    return null;
  }
  return value.slice("Bearer ".length).trim() || null;
}

export function requireBearerToken(req: { headers: HeaderBag }): string | null {
  return getBearerToken(req);
}
