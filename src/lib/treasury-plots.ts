/** Read plot registrations from SaraktTreasury on chain 1337. */

import { ethers } from "ethers";
import {
  getPaymentTreasuryContract,
  loadPaymentContractAddresses,
  PAYMENT_CONTRACT_ADDRESSES,
} from "@/lib/payment-contracts";

export type TreasuryPlotRecord = {
  plotId: number;
  buyer: string;
  pricePaid: string;
  paymentToken: string;
  registeredAt: number;
};

export async function getTreasuryPlotRecord(plotId: number): Promise<TreasuryPlotRecord | null> {
  await loadPaymentContractAddresses();
  const treasury = getPaymentTreasuryContract();
  if (!treasury) return null;

  try {
    const [buyer, pricePaid, paymentToken, registeredAt, registered] =
      await treasury.getPlotRecord(plotId);
    if (!registered) return null;
    return {
      plotId,
      buyer: String(buyer),
      pricePaid: ethers.formatEther(pricePaid),
      paymentToken: String(paymentToken),
      registeredAt: Number(registeredAt),
    };
  } catch {
    return null;
  }
}

export async function isPlotRegisteredOnTreasury(plotId: number): Promise<boolean> {
  await loadPaymentContractAddresses();
  const treasury = getPaymentTreasuryContract();
  if (!treasury) return false;
  try {
    return Boolean(await treasury.isPlotRegistered(plotId));
  } catch {
    return false;
  }
}

export async function fetchRegisteredPlotIds(plotIds: number[]): Promise<TreasuryPlotRecord[]> {
  const out: TreasuryPlotRecord[] = [];
  for (const id of plotIds) {
    const row = await getTreasuryPlotRecord(id);
    if (row) out.push(row);
  }
  return out;
}
