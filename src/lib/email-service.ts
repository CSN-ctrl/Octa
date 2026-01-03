import { supabase } from "@/integrations/supabase/client";

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType: string;
  }>;
}

export interface PlotPurchaseEmailData {
  plotId: number;
  ownerName: string;
  ownerWallet: string;
  ownerEmail: string;
  purchasePrice: number;
  purchaseDate: string;
  coordinates: { x: number; y: number };
  zoneType: string;
  certificateUrl?: string;
}

/**
 * Send email using Supabase Edge Function
 * This requires a Supabase Edge Function to be deployed
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  try {
    // Try to use Supabase Edge Function if available
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      },
    });

    if (error) {
      console.error("Email sending error:", error);
      // Fallback: log to console in development
      if (import.meta.env.DEV) {
        console.log("Email would be sent:", options);
        return { success: true, message: "Email logged (development mode)" };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    
    // Fallback: log to console in development
    if (import.meta.env.DEV) {
      console.log("Email would be sent:", options);
      return { success: true, message: "Email logged (development mode)" };
    }
    
    return { success: false, message: error.message || "Failed to send email" };
  }
}

/**
 * Send plot purchase confirmation email
 */
export async function sendPlotPurchaseEmail(data: PlotPurchaseEmailData): Promise<{ success: boolean; message: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .plot-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; }
        .info-value { color: #333; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Plot Purchase Confirmation</h1>
          <p>Welcome to the Chaos Star Universe!</p>
        </div>
        <div class="content">
          <p>Dear ${data.ownerName},</p>
          <p>Congratulations! Your plot purchase has been confirmed.</p>
          
          <div class="plot-info">
            <h2 style="margin-top: 0; color: #667eea;">Plot Details</h2>
            <div class="info-row">
              <span class="info-label">Plot ID:</span>
              <span class="info-value">#${data.plotId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Coordinates:</span>
              <span class="info-value">(${data.coordinates.x}, ${data.coordinates.y})</span>
            </div>
            <div class="info-row">
              <span class="info-label">Zone Type:</span>
              <span class="info-value">${data.zoneType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Purchase Price:</span>
              <span class="info-value">${data.purchasePrice} xBGL</span>
            </div>
            <div class="info-row">
              <span class="info-label">Purchase Date:</span>
              <span class="info-value">${new Date(data.purchaseDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Wallet Address:</span>
              <span class="info-value">${data.ownerWallet}</span>
            </div>
          </div>

          ${data.certificateUrl ? `
            <p>Your plot ownership certificate is ready for download:</p>
            <a href="${data.certificateUrl}" class="button">Download Certificate</a>
          ` : `
            <p>Your plot ownership certificate will be available in your dashboard shortly.</p>
          `}

          <p>Thank you for being part of the Chaos Star Universe!</p>
          
          <div class="footer">
            <p>Chaos Star Network<br>
            This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Plot Purchase Confirmation

Dear ${data.ownerName},

Congratulations! Your plot purchase has been confirmed.

Plot Details:
- Plot ID: #${data.plotId}
- Coordinates: (${data.coordinates.x}, ${data.coordinates.y})
- Zone Type: ${data.zoneType}
- Purchase Price: ${data.purchasePrice} xBGL
- Purchase Date: ${new Date(data.purchaseDate).toLocaleDateString()}
- Wallet Address: ${data.ownerWallet}

${data.certificateUrl ? `Download your certificate: ${data.certificateUrl}` : "Your plot ownership certificate will be available in your dashboard shortly."}

Thank you for being part of the Chaos Star Universe!

Chaos Star Network
  `;

  return await sendEmail({
    to: data.ownerEmail,
    subject: `Plot Purchase Confirmation - Plot #${data.plotId}`,
    html,
    text,
  });
}

/**
 * Send plot certificate email
 */
export async function sendPlotCertificateEmail(
  email: string,
  plotId: number,
  certificateUrl: string,
  ownerName: string
): Promise<{ success: boolean; message: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📜 Plot Ownership Certificate</h1>
        </div>
        <div class="content">
          <p>Dear ${ownerName},</p>
          <p>Your plot ownership certificate for Plot #${plotId} is ready!</p>
          <p>Click the button below to download your certificate:</p>
          <a href="${certificateUrl}" class="button">Download Certificate</a>
          <p>This certificate serves as proof of ownership for your plot in the Chaos Star Universe.</p>
          <div class="footer">
            <p>Chaos Star Network<br>
            This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Plot Ownership Certificate

Dear ${ownerName},

Your plot ownership certificate for Plot #${plotId} is ready!

Download your certificate: ${certificateUrl}

This certificate serves as proof of ownership for your plot in the Chaos Star Universe.

Chaos Star Network
  `;

  return await sendEmail({
    to: email,
    subject: `Plot Ownership Certificate - Plot #${plotId}`,
    html,
    text,
  });
}

