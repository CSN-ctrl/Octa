import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const NODE_CREDENTIAL_PREFIX = "octa_node_";
const PENDING_TOKEN_PREFIX = "octa_pending_";
const CHALLENGE_POLL_PREFIX = "octa_poll_";

export function generateNodeCredential(): { token: string; hash: string } {
  const secret = randomBytes(32).toString("hex");
  const token = `${NODE_CREDENTIAL_PREFIX}${secret}`;
  return { token, hash: hashSecret(token) };
}

export function generatePendingToken(): { token: string; hash: string } {
  const secret = randomBytes(32).toString("hex");
  const token = `${PENDING_TOKEN_PREFIX}${secret}`;
  return { token, hash: hashSecret(token) };
}

export function generateChallengePollSecret(): { token: string; hash: string } {
  const secret = randomBytes(32).toString("hex");
  const token = `${CHALLENGE_POLL_PREFIX}${secret}`;
  return { token, hash: hashSecret(token) };
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function parseNodeCredentialHeader(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const trimmed = authorization.trim();
  if (trimmed.startsWith("Node ")) {
    const token = trimmed.slice("Node ".length).trim();
    return token.startsWith(NODE_CREDENTIAL_PREFIX) ? token : null;
  }
  if (trimmed.startsWith("Bearer ") && trimmed.includes(NODE_CREDENTIAL_PREFIX)) {
    const token = trimmed.slice("Bearer ".length).trim();
    return token.startsWith(NODE_CREDENTIAL_PREFIX) ? token : null;
  }
  return null;
}

export function parsePendingTokenHeader(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const trimmed = authorization.trim();
  if (trimmed.startsWith("Pending ")) {
    const token = trimmed.slice("Pending ".length).trim();
    return token.startsWith(PENDING_TOKEN_PREFIX) ? token : null;
  }
  return null;
}

export function parseChallengePollHeader(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const trimmed = authorization.trim();
  if (trimmed.startsWith("Poll ")) {
    const token = trimmed.slice("Poll ".length).trim();
    return token.startsWith(CHALLENGE_POLL_PREFIX) ? token : null;
  }
  return null;
}

export function verifySecretHash(token: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !token) return false;
  const computed = hashSecret(token);
  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

export { NODE_CREDENTIAL_PREFIX, PENDING_TOKEN_PREFIX, CHALLENGE_POLL_PREFIX };
