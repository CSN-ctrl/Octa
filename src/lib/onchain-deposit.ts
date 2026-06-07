/**
 * On-chain AVAX → xBGL via SaraktTreasury.depositAvaxForXbgl (no Supabase ledger).
 */

import { ethers } from "ethers";
import { addPaymentNetwork } from "@/lib/wallet";
import {
  getPaymentTreasuryContract,
  loadPaymentContractAddresses,
} from "@/lib/payment-contracts";
import { convertAvaxAmountToXBGL, estimateXbglPerAvax } from "@/lib/xbgl-avax-pricing";

const TREASURY_DEPOSIT_ABI = [
  "function xbglPerAvaxE18() view returns (uint256)",
  "function quoteXbglForAvax(uint256 avaxWei) view returns (uint256)",
  "function depositAvaxForXbgl(uint256 minXbglOut) payable",
  "event AvaxSwappedForXbgl(address indexed buyer, uint256 avaxIn, uint256 xbglOut)",
] as const;

export type OnChainDepositQuote = {
  avaxWei: bigint;
  xbglWei: bigint;
  avaxHuman: number;
  xbglHuman: number;
  rateFromContract: boolean;
};

export async function getOnChainDepositQuote(avaxHuman: number): Promise<OnChainDepositQuote | null> {
  if (!Number.isFinite(avaxHuman) || avaxHuman <= 0) return null;
  await loadPaymentContractAddresses();
  const treasury = getPaymentTreasuryContract();
  if (!treasury) return null;

  const avaxWei = ethers.parseEther(avaxHuman.toString());
  let xbglWei = 0n;
  let rateFromContract = false;
  try {
    const withQuote = new ethers.Contract(
      await treasury.getAddress(),
      TREASURY_DEPOSIT_ABI,
      treasury.runner,
    );
    const rate = await withQuote.xbglPerAvaxE18();
    if (rate > 0n) {
      xbglWei = await withQuote.quoteXbglForAvax(avaxWei);
      rateFromContract = true;
    }
  } catch {
    /* fallback */
  }

  if (xbglWei === 0n) {
    const xbglHuman = await convertAvaxAmountToXBGL(avaxHuman);
    xbglWei = ethers.parseEther(xbglHuman.toFixed(18));
  }

  return {
    avaxWei,
    xbglWei,
    avaxHuman,
    xbglHuman: parseFloat(ethers.formatEther(xbglWei)),
    rateFromContract,
  };
}

export async function getOnChainXbglPerAvaxRate(): Promise<number> {
  await loadPaymentContractAddresses();
  const treasury = getPaymentTreasuryContract();
  if (!treasury) return convertAvaxAmountToXBGL(1);
  try {
    const c = new ethers.Contract(
      await treasury.getAddress(),
      TREASURY_DEPOSIT_ABI,
      treasury.runner,
    );
    const rate = await c.xbglPerAvaxE18();
    if (rate > 0n) return parseFloat(ethers.formatEther(rate));
  } catch {
    /* fallback */
  }
  return convertAvaxAmountToXBGL(1);
}

export async function depositAvaxForXbgl(
  signer: ethers.Signer,
  avaxHuman: number,
  slippageBps = 50,
  onSubmitted?: (txHash: string) => void,
): Promise<{ txHash: string; xbglOut: bigint }> {
  const quote = await getOnChainDepositQuote(avaxHuman);
  if (!quote) throw new Error("Treasury not configured");

  await loadPaymentContractAddresses();
  const treasuryAddr = (await import("@/lib/payment-contracts")).PAYMENT_CONTRACT_ADDRESSES.treasury;
  if (!treasuryAddr || !ethers.isAddress(treasuryAddr)) {
    throw new Error("Treasury address not set");
  }

  const provider = signer.provider;
  const ethereum =
    provider && "provider" in provider
      ? (provider as { provider?: unknown }).provider
      : typeof window !== "undefined"
        ? (window as { ethereum?: unknown }).ethereum
        : null;
  if (ethereum) await addPaymentNetwork(ethereum);

  const minXbgl =
    quote.xbglWei - (quote.xbglWei * BigInt(slippageBps)) / 10_000n;

  const treasury = new ethers.Contract(treasuryAddr, TREASURY_DEPOSIT_ABI, signer);
  const tx = await treasury.depositAvaxForXbgl(minXbgl, { value: quote.avaxWei });
  onSubmitted?.(tx.hash);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("No receipt");

  let xbglOut = quote.xbglWei;
  const iface = new ethers.Interface(TREASURY_DEPOSIT_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "AvaxSwappedForXbgl") {
        xbglOut = parsed.args.xbglOut as bigint;
        break;
      }
    } catch {
      /* not our event */
    }
  }

  return { txHash: receipt.hash, xbglOut };
}
