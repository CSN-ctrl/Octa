import { getApiBaseUrl } from "@/lib/app-origin";
import {
  parseCapNodes,
  parseChallengePublicPayload,
  type ApiEnvelope,
  type CapNodeSummary,
  type ChallengePublicPayload,
} from "@/lib/node-approve-contract";

async function readJson(res: Response): Promise<ApiEnvelope> {
  try {
    return (await res.json()) as ApiEnvelope;
  } catch {
    return { success: false, error: "invalid_json" };
  }
}

export class NodeApproveApiError extends Error {
  status: number;
  code: string;
  state?: string;
  nodes?: CapNodeSummary[];

  constructor(
    status: number,
    code: string,
    message?: string,
    extras?: { state?: string; nodes?: CapNodeSummary[] },
  ) {
    super(message ?? code);
    this.status = status;
    this.code = code;
    this.state = extras?.state;
    this.nodes = extras?.nodes;
  }
}

export async function fetchChallengePublic(challengeId: string): Promise<ChallengePublicPayload> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/nodes/challenge/${encodeURIComponent(challengeId)}/public`,
    { method: "GET", cache: "no-store" },
  );
  const body = await readJson(res);
  if (!res.ok || !body.success) {
    throw new NodeApproveApiError(
      res.status,
      body.error ?? "request_failed",
      body.message,
      { state: body.state },
    );
  }
  const parsed = parseChallengePublicPayload(body);
  if (!parsed) {
    throw new NodeApproveApiError(res.status, "invalid_response");
  }
  return parsed;
}

export async function postChallengeSign(
  challengeId: string,
  signature: string,
  replaceNodeId?: string,
): Promise<{ state: string; join_request_id?: string; node_id?: string }> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/nodes/challenge/${encodeURIComponent(challengeId)}/sign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        signature,
        ...(replaceNodeId ? { replace_node_id: replaceNodeId } : {}),
      }),
    },
  );
  const body = await readJson(res);
  if (res.ok && body.success) {
    return {
      state: body.state ?? "signed",
      join_request_id: body.join_request_id,
      node_id: body.node_id,
    };
  }
  const nodes = parseCapNodes(body.nodes) ?? undefined;
  throw new NodeApproveApiError(res.status, body.error ?? "request_failed", body.message, {
    state: body.state,
    nodes,
  });
}

export type ReplaceChallengeResult = {
  challenge_id: string;
  message: string;
  expires_at: string;
  nonce: string;
  replace_node_id: string;
  state: string;
};

export async function postChallengeReplace(
  challengeId: string,
  replaceNodeId: string,
  signature: string,
): Promise<ReplaceChallengeResult> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/nodes/challenge/${encodeURIComponent(challengeId)}/replace`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ replace_node_id: replaceNodeId, signature }),
    },
  );
  const body = await readJson(res);
  if (!res.ok || !body.success) {
    const nodes = parseCapNodes(body.nodes) ?? undefined;
    throw new NodeApproveApiError(res.status, body.error ?? "request_failed", body.message, {
      state: body.state,
      nodes,
    });
  }
  if (
    typeof body.message !== "string" ||
    typeof body.expires_at !== "string" ||
    typeof body.replace_node_id !== "string"
  ) {
    throw new NodeApproveApiError(res.status, "invalid_response");
  }
  return {
    challenge_id: body.challenge_id ?? challengeId,
    message: body.message,
    expires_at: body.expires_at,
    nonce: body.nonce ?? "",
    replace_node_id: body.replace_node_id,
    state: body.state ?? "pending",
  };
}
