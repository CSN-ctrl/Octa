const PROD_ORIGIN = "https://www.sarakt.com";

export function getAppOrigin(): string {
  if (typeof window === "undefined") return PROD_ORIGIN;

  const { hostname, origin } = window.location;

  // Keep localhost/dev environments working without forcing production URL.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }

  return PROD_ORIGIN;
}

