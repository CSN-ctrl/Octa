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

const buildVisualDoc = (data: OctaDocData, certId: string): string => {
  const ownerEmail = data.ownerEmail || "";
  const tx = data.transactionHash || "—";
  const issued = dateLabel(data.purchaseDate);
  const ownerName = escapeHtml(data.ownerName);
  const ownerWallet = escapeHtml(data.ownerWallet);
  const zone = escapeHtml(data.zoneType);
  const safeCertId = escapeHtml(certId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OctaDoc Plot Certificate</title>
  <style>
    :root {
      --bg: #090b14;
      --panel: #101525;
      --panel-2: #141c30;
      --line: rgba(138, 155, 255, 0.35);
      --text: #f4f7ff;
      --muted: #adb8d6;
      --accent: #7f90ff;
      --accent-2: #42d0ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background:
        radial-gradient(circle at 10% 10%, rgba(127, 144, 255, 0.20), transparent 35%),
        radial-gradient(circle at 90% 85%, rgba(66, 208, 255, 0.18), transparent 30%),
        var(--bg);
      color: var(--text);
      font: 15px/1.45 "Segoe UI", Inter, system-ui, sans-serif;
    }
    .doc {
      max-width: 980px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(160deg, rgba(20, 28, 48, 0.95), rgba(13, 18, 31, 0.98));
      box-shadow: 0 18px 50px rgba(0,0,0,0.45);
    }
    .head {
      padding: 26px 28px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .title { margin: 0; font-size: 29px; letter-spacing: 0.5px; }
    .subtitle { margin: 5px 0 0; color: var(--muted); font-size: 13px; }
    .badge {
      border: 1px solid rgba(66,208,255,0.5);
      color: #cbf4ff;
      background: rgba(66,208,255,0.12);
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 12px;
      white-space: nowrap;
    }
    .body {
      padding: 22px 28px 28px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
      padding: 16px;
    }
    .card h2 {
      margin: 0 0 10px;
      font-size: 14px;
      color: #d9e1ff;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }
    .row { margin: 7px 0; color: var(--muted); }
    .row strong { color: var(--text); }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      word-break: break-all;
    }
    .wide { grid-column: 1 / -1; }
    .legal {
      margin-top: 2px;
      color: var(--muted);
      font-size: 13px;
    }
    .foot {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed rgba(138,155,255,0.3);
      color: var(--muted);
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    @media (max-width: 760px) {
      body { padding: 14px; }
      .head, .body { padding: 16px; }
      .body { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="doc">
    <header class="head">
      <div>
        <h1 class="title">OCTA LAND OWNERSHIP CERTIFICATE</h1>
        <p class="subtitle">Sarakt Prime Registry · Plot #${data.plotId}</p>
      </div>
      <div class="badge">Certificate ID: ${safeCertId}</div>
    </header>

    <section class="body">
      <article class="card">
        <h2>Owner Information</h2>
        <p class="row"><strong>Name:</strong> ${ownerName}</p>
        <p class="row"><strong>Email:</strong> ${escapeHtml(ownerEmail || "—")}</p>
        <p class="row mono"><strong>Wallet:</strong> ${ownerWallet}</p>
      </article>

      <article class="card">
        <h2>Property Information</h2>
        <p class="row"><strong>Plot ID:</strong> #${data.plotId}</p>
        <p class="row"><strong>Coordinates:</strong> (${data.coordinates.x}, ${data.coordinates.y})</p>
        <p class="row"><strong>Zone Type:</strong> ${zone}</p>
      </article>

      <article class="card">
        <h2>Blockchain Record</h2>
        <p class="row"><strong>NFT Token ID:</strong> ${data.plotId}</p>
        <p class="row"><strong>Date of Issue:</strong> ${escapeHtml(issued)}</p>
        <p class="row mono"><strong>Tx Hash:</strong> ${escapeHtml(tx)}</p>
      </article>

      <article class="card">
        <h2>Issuer</h2>
        <p class="row"><strong>Authority:</strong> Octa Investment Group</p>
        <p class="row"><strong>Region:</strong> Star System Sarakt · Octavia Capital City</p>
        <p class="row"><strong>Status:</strong> Active Title</p>
      </article>

      <article class="card wide">
        <h2>Legal Notice</h2>
        <p class="legal">
          This document certifies ownership for the referenced plot and mirrors the corresponding on-chain
          registry state. In case of discrepancy, blockchain records remain the canonical source of truth.
        </p>
        <div class="foot">
          <span>Generated by OctaDoc</span>
          <span>Owner transfer rights are subject to platform rules and registry checks.</span>
        </div>
      </article>
    </section>
  </main>
</body>
</html>`;
};

export async function generateAndSaveOctaDocHtml(data: OctaDocData): Promise<{ url: string; filename: string }> {
  const certId = `OCTA-${String(data.plotId).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const html = buildVisualDoc(data, certId);
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
