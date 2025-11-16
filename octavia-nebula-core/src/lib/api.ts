export interface BackendPlot {
  wallet: string;
  token_id: string | number;
  metadata?: any;
}

function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "http://localhost:5001";
}

export async function fetchPlots(address: string): Promise<BackendPlot[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/plots/${address}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch plots: ${res.status}`);
  }
  const data = await res.json();
  return data?.plots || [];
}

export interface PendingPurchase {
  plotId: number;
  buyer: string;
  amount: number;
  paymentToken: string; // address(0) for AVAX
  timestamp: number;
}

export async function fetchPendingPurchases(): Promise<PendingPurchase[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/contracts/pending`);
  if (!res.ok) {
    throw new Error(`Failed to fetch pending purchases: ${res.status}`);
  }
  const data = await res.json();
  return data?.pending || [];
}

export async function activatePlot(plotId: number, recipient?: string): Promise<{ txHash: string; status: number }> {
  const base = getApiBase();
  const body = recipient ? { plotId, recipient } : { plotId };
  const res = await fetch(`${base}/contracts/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Activation failed: ${res.status}`);
  }
  const data = await res.json();
  return { txHash: data.txHash, status: data.status };
}

// Economy APIs
export async function getCurrencies() {
  const base = getApiBase();
  const res = await fetch(`${base}/economy/currencies`);
  if (!res.ok) throw new Error(`Failed to fetch currencies`);
  return res.json();
}

export async function getTreasury() {
  const base = getApiBase();
  const res = await fetch(`${base}/economy/treasury`);
  if (!res.ok) throw new Error(`Failed to fetch treasury`);
  return res.json();
}

// NPC APIs
export async function listNpcs() {
  const base = getApiBase();
  const res = await fetch(`${base}/npcs/`);
  if (!res.ok) throw new Error(`Failed to fetch NPCs`);
  return res.json();
}

export async function spawnNpcs(count: number, cohort?: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/npcs/spawn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, cohort }),
  });
  if (!res.ok) throw new Error(`Failed to spawn NPCs`);
  return res.json();
}

// City APIs
export async function listZones() {
  const base = getApiBase();
  const res = await fetch(`${base}/city/zones`);
  if (!res.ok) throw new Error(`Failed to fetch zones`);
  return res.json();
}

export async function listCityPlots() {
  const base = getApiBase();
  const res = await fetch(`${base}/city/plots`);
  if (!res.ok) throw new Error(`Failed to fetch city plots`);
  return res.json();
}

// Governance APIs
export async function listFactions() {
  const base = getApiBase();
  const res = await fetch(`${base}/governance/factions`);
  if (!res.ok) throw new Error(`Failed to fetch factions`);
  return res.json();
}

export async function getBlackMarket() {
  const base = getApiBase();
  const res = await fetch(`${base}/governance/black-market`);
  if (!res.ok) throw new Error(`Failed to fetch black market`);
  return res.json();
}

// Portfolio APIs
export async function getPortfolio(wallet: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/portfolio/${wallet}`);
  if (!res.ok) throw new Error(`Failed to fetch portfolio`);
  return res.json();
}

export async function getLoanEligibility(wallet: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/portfolio/${wallet}/loans`);
  if (!res.ok) throw new Error(`Failed to fetch loan eligibility`);
  return res.json();
}

export async function upsertPortfolio(input: {
  wallet: string;
  holdings?: Array<{ asset_type: string; identifier: string; cost_basis?: number; yield_annual?: number }>;
  recurring_investment_monthly?: number;
  manager_id?: string | null;
  portfolio_type?: "primary" | "secondary";
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/portfolio/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to upsert portfolio");
  }
  return res.json();
}

export async function projectPortfolio(input: { wallet: string; years?: number; expected_annual_return?: number }) {
  const base = getApiBase();
  const body = {
    wallet: input.wallet,
    years: input.years ?? 5,
    expected_annual_return: input.expected_annual_return ?? 0.07,
  };
  const res = await fetch(`${base}/portfolio/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to project portfolio");
  }
  return res.json();
}


