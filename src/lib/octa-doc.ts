import { supabase } from "@/integrations/supabase/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  const buyerSignature = escapeHtml(data.ownerName || "Buyer Signature");
  const sellerSignature = "Octa Investment Group";
  const sellerLabel = "SELLER: Octa Investment Group";
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
    ['src="image.png"', `src="${new URL("../../documents/image.png", import.meta.url).href}"`],
    ["BUYER:..............................................................................", `BUYER: ${escapeHtml(data.ownerName || "—")}`],
    ["SELLER:..............................................................................", sellerLabel],
    ["Georgi Penev", sellerSignature],
  ];

  let result = replacements.reduce((acc, [key, value]) => acc.replace(key, value), template);

  // Add explicit buyer e-signature text near the buyer line.
  if (!result.includes("buyer-esign")) {
    result = result.replace(
      `BUYER: ${escapeHtml(data.ownerName || "—")}</p>`,
      `BUYER: ${escapeHtml(data.ownerName || "—")}</p><p id="buyer-esign" class="font-signature text-3xl italic">${buyerSignature}</p>`
    );
  }

  return result;
};

const ORIGINAL_OCTADOC_TEMPLATE_URL = new URL("../../documents/octaDoc.html", import.meta.url).href;

const buildFilledOctaDocHtml = async (data: OctaDocData): Promise<{ html: string; certId: string }> => {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const templateResponse = await fetch(ORIGINAL_OCTADOC_TEMPLATE_URL, { cache: "no-store" });
  if (!templateResponse.ok) {
    throw new Error("Failed to load octaDoc template");
  }
  const template = await templateResponse.text();
  const html = applyTemplateValues(template, data, certId);
  return { html, certId };
};

const LAND_TITLE_TEMPLATE_URL = new URL("../../documents/LandOwnershipTitleCertificate.pdf", import.meta.url).href;

const renderTemplatePdf = async (data: OctaDocData, certId: string): Promise<Uint8Array> => {
  const response = await fetch(LAND_TITLE_TEMPLATE_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load LandOwnershipTitleCertificate.pdf template");

  const sourceBytes = new Uint8Array(await response.arrayBuffer());
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { height } = page.getSize();
  const textColor = rgb(1, 1, 1);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const issued = dateLabel(data.purchaseDate);
  const tx = data.transactionHash || "—";

  const draw = (value: string, x: number, yFromTop: number, size = 11, useBold = false) => {
    page.drawText(value, {
      x,
      y: height - yFromTop,
      size,
      font: useBold ? bold : font,
      color: textColor,
      maxWidth: 360,
    });
  };

  draw(certId, 182, 92, 10, true); // Unique Identifier
  draw(issued, 160, 208, 11); // Date of issue
  draw(data.ownerName || "—", 112, 292, 11);
  draw(data.ownerWallet || "—", 150, 318, 10);
  draw(data.ownerEmail || "—", 112, 343, 11);
  draw(`#${data.plotId}`, 118, 432, 11);
  draw(`(${data.coordinates.x}, ${data.coordinates.y})`, 188, 457, 11);
  draw(data.zoneType || "—", 132, 482, 11);
  draw(issued, 162, 507, 11); // Activation Date
  draw(String(data.plotId), 150, 532, 11);
  draw(tx, 176, 558, 9);

  if (pages.length > 1) {
    const p2 = pages[1];
    const h2 = p2.getSize().height;
    p2.drawText(String(data.plotId), { x: 170, y: h2 - 168, size: 11, font, color: textColor });
    p2.drawText(tx, { x: 225, y: h2 - 195, size: 9, font, color: textColor, maxWidth: 300 });
    p2.drawText(issued, { x: 205, y: h2 - 222, size: 11, font, color: textColor });
  }

  return new Uint8Array(await pdfDoc.save());
};

export async function generateAndSaveOctaDocHtml(data: OctaDocData): Promise<{ url: string; filename: string }> {
  const { html } = await buildFilledOctaDocHtml(data);
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

export async function generateAndSaveOctaDocPdf(data: OctaDocData): Promise<{ url: string; filename: string; pdfBytes: Uint8Array }> {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const pdfBytes = await renderTemplatePdf(data, certId);
  const filename = `Plot_${data.plotId}_OctaDoc_${Date.now()}.pdf`;
  const objectPath = `${data.plotId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("plot-certificates")
    .upload(objectPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload octaDoc PDF");
  }

  const { data: publicUrl } = supabase.storage.from("plot-certificates").getPublicUrl(objectPath);
  const url = publicUrl.publicUrl;

  await supabase.from("plot_documents").insert({
    plot_id: data.plotId,
    owner_wallet: data.ownerWallet,
    document_type: "ownership_pdf",
    document_url: url,
    filename,
    created_at: new Date().toISOString(),
  });

  return { url, filename, pdfBytes };
}
