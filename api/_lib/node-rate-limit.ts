import { STATUS_POLL_MIN_INTERVAL_MS } from "./node-constants";

const statusPollLast = new Map<string, number>();

export function rateLimitStatusPoll(key: string): boolean {
  const now = Date.now();
  const prev = statusPollLast.get(key) ?? 0;
  if (now - prev < STATUS_POLL_MIN_INTERVAL_MS) {
    return false;
  }
  statusPollLast.set(key, now);
  return true;
}

const heartbeatLast = new Map<string, number>();

export function rateLimitBrowserChallengeRead(key: string): boolean {
  return rateLimitStatusPoll(`browser:${key}`);
}

export function rateLimitBrowserChallengeWrite(key: string): boolean {
  return rateLimitStatusPoll(`browser:write:${key}`);
}

export function rateLimitHeartbeat(nodeId: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const prev = heartbeatLast.get(nodeId) ?? 0;
  if (now - prev < minIntervalMs) {
    return false;
  }
  heartbeatLast.set(nodeId, now);
  return true;
}
