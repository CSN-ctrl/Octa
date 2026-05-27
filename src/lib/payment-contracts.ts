/**
 * Contract addresses on the payment rail (Avalanche Fuji 43113) — land, xBGL token, treasury.
 */

import { ethers } from "ethers";
import {
  LAND_CONTRACT_ABI,
  TREASURY_ABI,
  getERC20Contract,
} from "@/lib/contracts";
import { getPaymentJsonRpcProvider } from "@/lib/evm-provider";
import { getPaymentChainId, getPaymentDeploymentsPath } from "@/config/blockchain-profile";
import { PAYMENT_CHAIN_ID } from "@/config/payment-network";

export { formatPaymentXbglBalance } from "@/lib/payment-balance";

export type PaymentContractAddresses = {
  land: string;
  xbglToken: string;
  treasury: string;
  digitalID: string;
  /** Canonical xBGL on ChaosStar (8888) — reference only; in-game token is xbglToken on 1337. */
  chaosstarXbglReference: string | null;
};

export const PAYMENT_CONTRACT_ADDRESSES: PaymentContractAddresses = {
  land: import.meta.env.VITE_CONTRACT_ADDRESS?.toString().trim() || "",
  xbglToken: import.meta.env.VITE_XBGL_TOKEN_ADDRESS?.toString().trim() || "",
  treasury: import.meta.env.VITE_TREASURY_ADDRESS?.toString().trim() || "",
  digitalID: import.meta.env.VITE_DIGITAL_ID_ADDRESS?.toString().trim() || "",
  chaosstarXbglReference:
    import.meta.env.VITE_CHAOSSTAR_XBGL_ADDRESS?.toString().trim() || null,
};

let paymentAddressesLoaded = false;
let paymentLoadPromise: Promise<boolean> | null = null;

export async function loadPaymentContractAddresses(): Promise<boolean> {
  if (paymentLoadPromise) return paymentLoadPromise;
  if (paymentAddressesLoaded && PAYMENT_CONTRACT_ADDRESSES.land) return true;

  paymentLoadPromise = (async () => {
    const chainId = getPaymentChainId();
    const paths = [
      getPaymentDeploymentsPath(),
      `/sandbox/deployments/${chainId}-latest.json`,
      `/sandbox/deployments/${PAYMENT_CHAIN_ID}-latest.json`,
      "/sandbox/deployments/1337-latest.json",
    ];
    for (const filePath of paths) {
      try {
        const response = await fetch(filePath, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) continue;
        const data = await response.json();
        const addresses = data.contracts || data.addresses || data;
        if (addresses.SaraktLandV2 || addresses.land || addresses.XBGLToken) {
          if (data.chaosstarXbglReference) {
            PAYMENT_CONTRACT_ADDRESSES.chaosstarXbglReference = data.chaosstarXbglReference;
          }
          PAYMENT_CONTRACT_ADDRESSES.land =
            addresses.land || addresses.SaraktLandV2 || PAYMENT_CONTRACT_ADDRESSES.land;
          PAYMENT_CONTRACT_ADDRESSES.xbglToken =
            addresses.xbglToken ||
            addresses.XBGLToken ||
            PAYMENT_CONTRACT_ADDRESSES.xbglToken;
          PAYMENT_CONTRACT_ADDRESSES.treasury =
            addresses.treasury ||
            addresses.SaraktTreasury ||
            PAYMENT_CONTRACT_ADDRESSES.treasury;
          PAYMENT_CONTRACT_ADDRESSES.digitalID =
            addresses.digitalID ||
            addresses.LocalDigitalID ||
            PAYMENT_CONTRACT_ADDRESSES.digitalID;

          const { CONTRACT_ADDRESSES } = await import("@/lib/contracts");
          CONTRACT_ADDRESSES.land = PAYMENT_CONTRACT_ADDRESSES.land;
          CONTRACT_ADDRESSES.xbglToken = PAYMENT_CONTRACT_ADDRESSES.xbglToken;
          CONTRACT_ADDRESSES.treasury = PAYMENT_CONTRACT_ADDRESSES.treasury;
          CONTRACT_ADDRESSES.digitalID = PAYMENT_CONTRACT_ADDRESSES.digitalID;
          CONTRACT_ADDRESSES.plotRegistry = PAYMENT_CONTRACT_ADDRESSES.treasury;

          paymentAddressesLoaded = true;
          return true;
        }
      } catch {
        /* try next path */
      }
    }
    return !!(paymentAddressesLoaded && PAYMENT_CONTRACT_ADDRESSES.land);
  })();

  return paymentLoadPromise;
}

export function hasPaymentLandContract(): boolean {
  const land = PAYMENT_CONTRACT_ADDRESSES.land;
  return !!(land && land.trim() !== "" && /^0x[a-fA-F0-9]{40}$/.test(land));
}

export function getPaymentLandContract(signer?: ethers.Signer) {
  const landAddress = PAYMENT_CONTRACT_ADDRESSES.land;
  if (!hasPaymentLandContract()) return null;
  try {
    if (signer) {
      return new ethers.Contract(landAddress, LAND_CONTRACT_ABI, signer);
    }
    return new ethers.Contract(landAddress, LAND_CONTRACT_ABI, getPaymentJsonRpcProvider());
  } catch {
    return null;
  }
}

export function getPaymentXbglTokenContract(signer?: ethers.Signer) {
  const addr = PAYMENT_CONTRACT_ADDRESSES.xbglToken;
  if (!addr || !ethers.isAddress(addr)) return null;
  return getERC20Contract(addr, signer);
}

export function getPaymentTreasuryContract(signer?: ethers.Signer) {
  const addr = PAYMENT_CONTRACT_ADDRESSES.treasury;
  if (!addr || !ethers.isAddress(addr)) return null;
  try {
    if (signer) return new ethers.Contract(addr, TREASURY_ABI, signer);
    return new ethers.Contract(addr, TREASURY_ABI, getPaymentJsonRpcProvider());
  } catch {
    return null;
  }
}
