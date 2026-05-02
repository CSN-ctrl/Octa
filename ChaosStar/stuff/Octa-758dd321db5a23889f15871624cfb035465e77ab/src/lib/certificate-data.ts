import { supabase } from "@/integrations/supabase/client";
import { getPlotById } from "@/lib/supabase-service";

export interface LandTitleCertificateData {
  uniqueId: string;
  dateOfIssue: string;
  ownerName: string;
  walletAddress: string;
  email: string;
  citizenId: string;
  plotId: number;
  coordinatesSector: string;
  zoneType: string;
  activationDate: string;
  nftTokenId: string;
  transactionHash: string;
  tokenContractAddress: string;
  buyerSignatureName: string;
}

const TOKEN_CONTRACT_PLACEHOLDER = "—";

/**
 * Fetch certificate data for a plot: owner from session + plot from Supabase.
 */
export async function getCertificateData(
  plotId: number,
  ownerIdentifier: string,
  options?: { ownerName?: string; ownerEmail?: string }
): Promise<LandTitleCertificateData | null> {
  const plot = await getPlotById(plotId);
  if (!plot || !plot.owner_wallet) return null;

  const ownerWallet = plot.owner_wallet;
  const ident = ownerIdentifier.toLowerCase();
  const ownerMatches =
    ownerWallet.toLowerCase() === ident ||
    (options?.ownerEmail && ownerWallet.toLowerCase() === options.ownerEmail.toLowerCase());
  if (!ownerMatches) return null;

  let activationTxHash = "";
  let activationDate = "";
  try {
    const { getTransactions } = await import("@/lib/supabase-service");
    const txList = await getTransactions({ plotId, limit: 1 });
    if (txList.length > 0) {
      activationTxHash = txList[0].tx_hash || "";
      activationDate = txList[0].created_at
        ? new Date(txList[0].created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";
    }
  } catch {
    // ignore
  }

  const created = plot.created_at
    ? new Date(plot.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const name =
    options?.ownerName?.trim() ||
    (await resolveOwnerName(ownerWallet)) ||
    `${ownerWallet.slice(0, 6)}…${ownerWallet.slice(-4)}`;
  const email = options?.ownerEmail?.trim() || (isEmail(ownerWallet) ? ownerWallet : "");

  return {
    uniqueId: `CS-${String(plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`,
    dateOfIssue: created || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    ownerName: name,
    walletAddress: ownerWallet,
    email,
    citizenId: "",
    plotId: plot.id,
    coordinatesSector: `(${plot.coord_x}, ${plot.coord_y})`,
    zoneType: plot.zone_type || "—",
    activationDate: activationDate || created || "—",
    nftTokenId: String(plot.id),
    transactionHash: activationTxHash || "—",
    tokenContractAddress: TOKEN_CONTRACT_PLACEHOLDER,
    buyerSignatureName: name,
  };
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function resolveOwnerName(wallet: string): Promise<string | null> {
  try {
    const { data: di } = await supabase
      .from("digital_identities")
      .select("name")
      .eq("wallet_address", wallet.toLowerCase())
      .limit(1)
      .maybeSingle();
    if (di?.name) return di.name;
  } catch {
    // ignore
  }
  return null;
}
