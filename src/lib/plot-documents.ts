import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabase } from "@/integrations/supabase/client";

export interface PlotDocumentData {
  plotId: number;
  ownerName: string;
  ownerWallet: string;
  ownerEmail: string;
  coordinates: { x: number; y: number };
  zoneType: string;
  purchasePrice: number;
  purchaseDate: string;
  transactionHash?: string;
}

/**
 * Generate plot ownership certificate PDF
 */
export async function generatePlotCertificate(data: PlotDocumentData): Promise<{ pdfBytes: Uint8Array; filename: string }> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size

  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.4, 0.3, 0.9); // Purple/violet
  const textColor = rgb(0.1, 0.1, 0.1);
  const mutedColor = rgb(0.5, 0.5, 0.5);

  // Header
  page.drawText("CHAOS STAR UNIVERSE", {
    x: 50,
    y: 780,
    size: 24,
    font: helveticaBoldFont,
    color: primaryColor,
  });

  page.drawText("Plot Ownership Certificate", {
    x: 50,
    y: 750,
    size: 18,
    font: helveticaBoldFont,
    color: textColor,
  });

  // Draw a line
  page.drawLine({
    start: { x: 50, y: 740 },
    end: { x: 545, y: 740 },
    thickness: 2,
    color: primaryColor,
  });

  // Certificate ID
  const certId = `CS-${String(data.plotId).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
  page.drawText(`Certificate ID: ${certId}`, {
    x: 50,
    y: 710,
    size: 10,
    font: helveticaFont,
    color: mutedColor,
  });

  // Main content
  let yPos = 650;

  page.drawText("This certifies that", {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: textColor,
  });

  yPos -= 30;

  // Owner name (highlighted)
  page.drawText(data.ownerName, {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: primaryColor,
  });

  yPos -= 40;

  page.drawText("is the rightful owner of", {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: textColor,
  });

  yPos -= 30;

  // Plot ID (highlighted)
  page.drawText(`Plot #${data.plotId}`, {
    x: 50,
    y: yPos,
    size: 20,
    font: helveticaBoldFont,
    color: primaryColor,
  });

  yPos -= 60;

  // Plot Details Section
  page.drawText("Plot Details", {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBoldFont,
    color: textColor,
  });

  yPos -= 30;

  const details = [
    { label: "Plot ID:", value: `#${data.plotId}` },
    { label: "Coordinates:", value: `(${data.coordinates.x}, ${data.coordinates.y})` },
    { label: "Zone Type:", value: data.zoneType },
    { label: "Purchase Price:", value: `${data.purchasePrice} xBGL` },
    { label: "Purchase Date:", value: new Date(data.purchaseDate).toLocaleDateString() },
    { label: "Wallet Address:", value: data.ownerWallet },
  ];

  if (data.transactionHash) {
    details.push({ label: "Transaction Hash:", value: data.transactionHash });
  }

  details.forEach((detail) => {
    page.drawText(detail.label, {
      x: 70,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: mutedColor,
    });

    page.drawText(detail.value, {
      x: 200,
      y: yPos,
      size: 10,
      font: helveticaBoldFont,
      color: textColor,
    });

    yPos -= 25;
  });

  // Footer
  yPos = 150;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: 545, y: yPos },
    thickness: 1,
    color: mutedColor,
  });

  yPos -= 30;

  page.drawText("This certificate is issued by the Chaos Star Network", {
    x: 50,
    y: yPos,
    size: 10,
    font: helveticaFont,
    color: mutedColor,
  });

  yPos -= 20;

  page.drawText("and serves as proof of ownership in the Chaos Star Universe.", {
    x: 50,
    y: yPos,
    size: 10,
    font: helveticaFont,
    color: mutedColor,
  });

  yPos -= 40;

  page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yPos,
    size: 9,
    font: helveticaFont,
    color: mutedColor,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const filename = `Plot_${data.plotId}_Certificate_${Date.now()}.pdf`;

  return { pdfBytes, filename };
}

/**
 * Upload certificate to Supabase Storage and return URL
 */
export async function uploadCertificateToStorage(
  pdfBytes: Uint8Array,
  filename: string,
  plotId: number
): Promise<string> {
  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("plot-certificates")
      .upload(`${plotId}/${filename}`, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      // If bucket doesn't exist, create it or use public URL
      console.error("Storage upload error:", error);
      // Fallback: return a data URL
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      return url;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("plot-certificates")
      .getPublicUrl(`${plotId}/${filename}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload certificate:", error);
    // Fallback: return a data URL
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    return url;
  }
}

/**
 * Generate and save plot certificate
 */
export async function generateAndSaveCertificate(
  data: PlotDocumentData
): Promise<{ url: string; filename: string }> {
  const { pdfBytes, filename } = await generatePlotCertificate(data);
  const url = await uploadCertificateToStorage(pdfBytes, filename, data.plotId);

  // Save certificate record to database
  try {
    await supabase.from("plot_documents").insert({
      plot_id: data.plotId,
      owner_wallet: data.ownerWallet,
      document_type: "certificate",
      document_url: url,
      filename: filename,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to save certificate record:", error);
    // Continue even if database save fails
  }

  return { url, filename };
}

/**
 * Download certificate as file
 */
export function downloadCertificate(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

