import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const buildFilledOctaDocHtml = async (data: OctaDocData): Promise<{ html: string; certId: string }> => {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const templateResponse = await fetch("/documents/octaDoc.html", { cache: "no-store" });
  if (!templateResponse.ok) {
    throw new Error("Failed to load octaDoc template");
  }
  const template = await templateResponse.text();
  const html = applyTemplateValues(template, data, certId);
  return { html, certId };
};

const renderHtmlToPdf = async (html: string): Promise<Uint8Array> => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "1200px";
  iframe.style.height = "1700px";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Failed to initialize conversion document");

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve, reject) => {
      const maxWaitMs = 8000;
      const start = Date.now();
      const poll = () => {
        const ready = doc.readyState === "complete" && doc.body;
        if (ready) {
          resolve();
          return;
        }
        if (Date.now() - start > maxWaitMs) {
          reject(new Error("Timed out while loading OctaDoc HTML"));
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
    });

    if ((doc as any).fonts?.ready) {
      await (doc as any).fonts.ready;
    }

    const target = doc.documentElement;
    const canvas = await html2canvas(target, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: Math.max(target.scrollWidth, 1200),
      windowHeight: Math.max(target.scrollHeight, 1600),
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(imageData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    return new Uint8Array(pdf.output("arraybuffer"));
  } finally {
    document.body.removeChild(iframe);
  }
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
  const { html } = await buildFilledOctaDocHtml(data);
  const pdfBytes = await renderHtmlToPdf(html);
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
