import { supabase } from "@/integrations/supabase/client";

export interface OctaDocData {
  plotId: number;
  ownerName: string;
  ownerWallet: string;
  ownerEmail?: string;
  coordinates: { x: number; y: number };
  zoneType: string;
  purchaseDate: string;
  transactionHash?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const dateLabel = (iso: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const applyTemplateValues = (template: string, data: OctaDocData, certId: string): string => {
  const issued = dateLabel(data.purchaseDate);
  const tx = data.transactionHash || "—";
  const replacements: Array<[string, string]> = [
    ["Unique Identifier:", `Unique Identifier: ${escapeHtml(certId)}`],
    ["Date of Issue:", `Date of Issue: ${escapeHtml(issued)}`],
    ["Name:", `Name: ${escapeHtml(data.ownerName || "—")}`],
    ["Wallet Address:", `Wallet Address: ${escapeHtml(data.ownerWallet || "—")}`],
    ["Email:", `Email: ${escapeHtml(data.ownerEmail || "—")}`],
    ["Plot ID:", `Plot ID: #${data.plotId}`],
    ["Coordinates / Sector:", `Coordinates / Sector: (${data.coordinates.x}, ${data.coordinates.y})`],
    ["Zone Type:", `Zone Type: ${escapeHtml(data.zoneType || "—")}`],
    ["Activation Date:", `Activation Date: ${escapeHtml(issued)}`],
    ["NFT Token ID:", `NFT Token ID: ${data.plotId}`],
    ["Transaction Hash:", `Transaction Hash: ${escapeHtml(tx)}`],
    ["Activation Transaction Hash:", `Activation Transaction Hash: ${escapeHtml(tx)}`],
    ["Date of Title Issuance:", `Date of Title Issuance: ${escapeHtml(issued)}`],
  ];

  return replacements.reduce((acc, [key, value]) => acc.replace(key, value), template);
};

export async function generateAndSaveOctaDocHtml(data: OctaDocData): Promise<{ url: string; filename: string }> {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const templateResponse = await fetch("/documents/octaDoc.html", { cache: "no-store" });
  if (!templateResponse.ok) {
    throw new Error("Failed to load octaDoc template");
  }
  const template = await templateResponse.text();
  const html = applyTemplateValues(template, data, certId);
  const filename = `Plot_${data.plotId}_OctaDoc_${Date.now()}.html`;
  const objectPath = `${data.plotId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("plot-certificates")
    .upload(objectPath, new Blob([html], { type: "text/html;charset=utf-8" }), {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload octaDoc HTML");
  }

  const { data: publicUrl } = supabase.storage.from("plot-certificates").getPublicUrl(objectPath);
  const url = publicUrl.publicUrl;

  await supabase.from("plot_documents").insert({
    plot_id: data.plotId,
    owner_wallet: data.ownerWallet,
    document_type: "ownership_html",
    document_url: url,
    filename,
    created_at: new Date().toISOString(),
  });

  return { url, filename };
}
