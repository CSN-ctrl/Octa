/**
 * Enhanced QR Code Generation Utilities
 * Supports EIP-681 payment URIs and logo overlays
 */

import QRCode from "qrcode";
import { NetworkConfig } from "./networks";

/**
 * Generate EIP-681 payment URI for Ethereum-based networks
 * Format: ethereum:TOKEN_ADDRESS@CHAIN_ID/transfer?address=RECIPIENT&uint256=AMOUNT
 */
export function generatePaymentURI(
  network: NetworkConfig,
  recipientAddress: string,
  amount?: number,
  tokenAddress?: string
): string {
  // If no amount specified, return plain address (backward compatible)
  if (!amount) {
    return recipientAddress;
  }

  // Use USDC address if token not specified
  const token = tokenAddress || network.usdcAddress;
  
  // USDC has 6 decimals, so multiply by 1e6
  const amountInSmallestUnit = Math.floor(amount * 1e6).toString();
  
  // EIP-681 format for ERC20 transfers
  return `ethereum:${token}@${network.chainId}/transfer?address=${recipientAddress}&uint256=${amountInSmallestUnit}`;
}

/**
 * Generate payment URI for non-Ethereum networks (if needed)
 */
export function generatePaymentURIForNetwork(
  network: NetworkConfig,
  recipientAddress: string,
  amount?: number
): string {
  // For now, use EIP-681 for all EVM-compatible chains
  // Can be extended for other formats if needed
  return generatePaymentURI(network, recipientAddress, amount);
}

interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
  includeAmount?: boolean;
  amount?: number;
  logoUrl?: string;
}

/**
 * Generate enhanced QR code with optional payment URI and logo
 */
export async function generateEnhancedQRCode(
  network: NetworkConfig,
  address: string,
  options: QRCodeOptions = {}
): Promise<string | null> {
  const {
    width = 280,
    margin = 2,
    errorCorrectionLevel = 'H', // High error correction for better scanning
    color = {
      dark: "#000000",
      light: "#ffffff"
    },
    includeAmount = false,
    amount,
    logoUrl
  } = options;

  try {
    // Generate payment URI if amount is included
    const qrData = includeAmount && amount
      ? generatePaymentURI(network, address, amount)
      : address;

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width,
      margin,
      errorCorrectionLevel,
      color,
      rendererOpts: {
        quality: 0.92
      }
    });

    // Validate the generated QR code
    if (!qrDataUrl || !qrDataUrl.startsWith('data:image')) {
      throw new Error('Invalid QR code data URL generated');
    }

    // Overlay logo if provided
    if (logoUrl) {
      return await overlayLogoOnQR(qrDataUrl, logoUrl, width);
    }

    return qrDataUrl;
  } catch (error) {
    console.error(`Failed to generate QR code for ${network.name}:`, error);
    return null;
  }
}

/**
 * Overlay logo on QR code
 */
async function overlayLogoOnQR(
  qrDataUrl: string,
  logoUrl: string,
  qrWidth: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    const logoImg = new Image();

    qrImg.crossOrigin = 'anonymous';
    logoImg.crossOrigin = 'anonymous';

    qrImg.onload = () => {
      logoImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = qrImg.width;
          canvas.height = qrImg.height;

          // Draw QR code
          ctx.drawImage(qrImg, 0, 0);

          // Calculate logo size (20% of QR code)
          const logoSize = qrImg.width * 0.2;
          const logoX = (qrImg.width - logoSize) / 2;
          const logoY = (qrImg.height - logoSize) / 2;

          // Draw white background for logo (with rounded corners)
          ctx.fillStyle = '#ffffff';
          const padding = 8;
          const bgX = logoX - padding;
          const bgY = logoY - padding;
          const bgSize = logoSize + (padding * 2);
          const radius = 8;
          
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgSize - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
          ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
          ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
          ctx.lineTo(bgX + radius, bgY + bgSize);
          ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();

          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

          resolve(canvas.toDataURL('image/png', 0.92));
        } catch (error) {
          reject(error);
        }
      };

      logoImg.onerror = () => {
        // If logo fails to load, return QR code without logo
        console.warn('Failed to load logo, returning QR code without logo');
        resolve(qrDataUrl);
      };
      logoImg.src = logoUrl;
    };

    qrImg.onerror = () => reject(new Error('Failed to load QR code'));
    qrImg.src = qrDataUrl;
  });
}

/**
 * Get network logo URL from public CDN
 * Using multiple reliable sources for network logos
 */
export function getNetworkLogoUrl(networkId: string): string {
  // Using CoinGecko, Trust Wallet, and other reliable CDNs for network logos
  const logoUrls: Record<string, string> = {
    'ethereum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    'avalanche': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    'polygon': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    'bsc': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    'arbitrum': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    'optimism': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    'base': 'https://assets.coingecko.com/coins/images/27509/small/base.png',
    'avalanche-fuji': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png'
  };

  return logoUrls[networkId] || '';
}
