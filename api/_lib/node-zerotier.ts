export type ZeroTierConfig = {
  apiToken: string;
  networkId: string;
};

export function getZeroTierConfig(): ZeroTierConfig | null {
  const apiToken = process.env.ZEROTIER_API_TOKEN?.trim();
  const networkId = process.env.ZEROTIER_NETWORK_ID?.trim();
  if (!apiToken || !networkId) return null;
  return { apiToken, networkId };
}

export type ZeroTierMemberResult = {
  ok: boolean;
  authorized?: boolean;
  error?: string;
  statusCode?: number;
};

/** Idempotent authorize: POST member with authorized:true; treats already-authorized as success. */
export async function authorizeZeroTierMember(
  memberId: string,
  memberName: string,
  config?: ZeroTierConfig | null,
): Promise<ZeroTierMemberResult> {
  const resolved = config ?? getZeroTierConfig();
  if (!resolved) {
    return { ok: false, error: "zerotier_not_configured" };
  }

  const base = `https://api.zerotier.com/api/v1/network/${resolved.networkId}/member/${memberId.toLowerCase()}`;

  const getRes = await fetch(base, {
    method: "GET",
    headers: { Authorization: `Bearer ${resolved.apiToken}` },
  });

  if (getRes.ok) {
    const existing = (await getRes.json()) as { config?: { authorized?: boolean } };
    if (existing?.config?.authorized === true) {
      return { ok: true, authorized: true, statusCode: 200 };
    }
  }

  const postRes = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolved.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorized: true, name: memberName }),
  });

  if (postRes.ok) {
    return { ok: true, authorized: true, statusCode: postRes.status };
  }

  const text = await postRes.text().catch(() => "");
  return {
    ok: false,
    error: text || "zerotier_authorize_failed",
    statusCode: postRes.status,
  };
}

export async function deauthorizeZeroTierMember(
  memberId: string,
  config?: ZeroTierConfig | null,
): Promise<ZeroTierMemberResult> {
  const resolved = config ?? getZeroTierConfig();
  if (!resolved) {
    return { ok: false, error: "zerotier_not_configured" };
  }

  const base = `https://api.zerotier.com/api/v1/network/${resolved.networkId}/member/${memberId.toLowerCase()}`;
  const postRes = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolved.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorized: false }),
  });

  if (postRes.ok || postRes.status === 404) {
    return { ok: true, authorized: false, statusCode: postRes.status };
  }

  const text = await postRes.text().catch(() => "");
  return { ok: false, error: text || "zerotier_deauthorize_failed", statusCode: postRes.status };
}
