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

const patchTemplate = (html: string, data: OctaDocData, certId: string): string => {
  const ownerEmail = data.ownerEmail || "";
  const tx = data.transactionHash || "—";
  const issued = dateLabel(data.purchaseDate);
  const ownerName = escapeHtml(data.ownerName);
  const ownerWallet = escapeHtml(data.ownerWallet);

  return html
    .replace("Unique Identifier:", `Unique Identifier: ${escapeHtml(certId)}`)
    .replace("<p class=\"mt-3\">Date of Issue:</p>", `<p class="mt-3">Date of Issue: ${escapeHtml(issued)}</p>`)
    .replace("<p>Name:</p>", `<p>Name: ${ownerName}</p>`)
    .replace("<p>Wallet Address:</p>", `<p>Wallet Address: ${ownerWallet}</p>`)
    .replace("<p>Email:</p>", `<p>Email: ${escapeHtml(ownerEmail)}</p>`)
    .replace("<p>Plot ID:</p>", `<p>Plot ID: #${data.plotId}</p>`)
    .replace(
      "<p>Coordinates / Sector:</p>",
      `<p>Coordinates / Sector: (${data.coordinates.x}, ${data.coordinates.y})</p>`,
    )
    .replace("<p>Zone Type:</p>", `<p>Zone Type: ${escapeHtml(data.zoneType)}</p>`)
    .replace("<p>Activation Date:</p>", `<p>Activation Date: ${escapeHtml(issued)}</p>`)
    .replace("<p>NFT Token ID:</p>", `<p>NFT Token ID: ${data.plotId}</p>`)
    .replace("<p>Transaction Hash:</p>", `<p>Transaction Hash: ${escapeHtml(tx)}</p>`)
    .replace("<p>Date of Title Issuance:</p>", `<p>Date of Title Issuance: ${escapeHtml(issued)}</p>`);
};

export async function generateAndSaveOctaDocHtml(data: OctaDocData): Promise<{ url: string; filename: string }> {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const source = await fetch("/documents/octaDoc.html");
  if (!source.ok) {
    throw new Error("octaDoc template not found at /documents/octaDoc.html");
  }

  const template = await source.text();
  const html = patchTemplate(template, data, certId);
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
