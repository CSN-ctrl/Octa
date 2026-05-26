/**

 * On-chain in-game currency: xBGL ERC-20 on Avalanche 1337 only.

 * ChaosStar (8888) supplies the canonical xBGL reference address at deploy time — not used for balances here.

 */



import { ethers } from "ethers";

import { addLocalAvaxNetwork } from "@/lib/wallet";

import {

  formatPaymentXbglBalance,

  getPaymentXbglTokenContract,

  loadPaymentContractAddresses,

  PAYMENT_CONTRACT_ADDRESSES,

} from "@/lib/payment-contracts";

import { getNativeBalanceWei } from "@/lib/chain-network";

import { getPaymentRpcUrl } from "@/config/payment-network";

import { isOnChainCryptoMode } from "@/lib/chain-network";



export interface UiBalanceRow {

  wallet_address?: string;

  xbgl_balance: number;

  avax_balance?: number;

  chaos_balance?: number;

}



export function parseXbglToWei(amount: number | string): bigint {

  const n = typeof amount === "string" ? parseFloat(amount) : amount;

  if (!Number.isFinite(n) || n <= 0) return 0n;

  return ethers.parseEther(n.toString());

}



/** Balance for UI — xBGL on chain 1337 + AVAX gas on same chain. */

export async function loadUserBalanceForUi(

  walletAddress: string | null,

  email?: string | null

): Promise<UiBalanceRow | null> {

  if (isOnChainCryptoMode()) {
    if (!walletAddress || !ethers.isAddress(walletAddress)) return null;

    await loadPaymentContractAddresses();
    const { formatted } = await formatPaymentXbglBalance(walletAddress);
    const avaxWei = await getNativeBalanceWei(walletAddress, getPaymentRpcUrl());

    return {
      wallet_address: walletAddress.toLowerCase(),
      xbgl_balance: parseFloat(formatted) || 0,
      avax_balance: parseFloat(ethers.formatEther(avaxWei)) || 0,
    };
  }

  const { getUserBalance } = await import("@/lib/supabase-service");

  if (walletAddress) {

    const row = await getUserBalance(walletAddress.toLowerCase()).catch(() => null);

    if (row) return row as UiBalanceRow;

  }

  if (email) {

    const row = await getUserBalance(email.toLowerCase()).catch(() => null);

    if (row) return row as UiBalanceRow;

  }

  return null;

}



async function ensurePaymentSignerNetwork(signer: ethers.Signer) {

  const provider = signer.provider;

  const ethereum =

    provider && "provider" in provider

      ? (provider as { provider?: unknown }).provider

      : typeof window !== "undefined"

        ? (window as { ethereum?: unknown }).ethereum

        : null;

  if (ethereum) {

    await addLocalAvaxNetwork(ethereum);

  }

}



/** Transfer in-game xBGL (ERC-20 on 1337). */

export async function sendXbglTransfer(

  signer: ethers.Signer,

  toAddress: string,

  amountHuman: number | string

): Promise<{ success: true; txHash: string } | { success: false; error: string }> {

  if (!ethers.isAddress(toAddress)) {

    return { success: false, error: "Invalid recipient address" };

  }

  const wei = parseXbglToWei(amountHuman);

  if (wei <= 0n) {

    return { success: false, error: "Invalid amount" };

  }



  try {

    await loadPaymentContractAddresses();

    const tokenAddress = PAYMENT_CONTRACT_ADDRESSES.xbglToken?.trim();

    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {

      return { success: false, error: "xBGL token not deployed on chain 1337" };

    }



    await ensurePaymentSignerNetwork(signer);



    const from = await signer.getAddress();

    const { wei: balance } = await formatPaymentXbglBalance(from);

    if (balance < wei) {

      return { success: false, error: "Insufficient xBGL balance" };

    }



    const erc20 = getPaymentXbglTokenContract(signer);

    if (!erc20) {

      return { success: false, error: "xBGL token contract unavailable" };

    }

    const tx = await erc20.transfer(toAddress, wei);

    const receipt = await tx.wait();

    return { success: true, txHash: receipt?.hash ?? tx.hash };

  } catch (err: unknown) {

    const e = err as { reason?: string; message?: string };

    return {

      success: false,

      error: e.reason || e.message || "Transfer failed",

    };

  }

}



/** @deprecated Use sendXbglTransfer */

export const sendNativeTransfer = sendXbglTransfer;



export function getXbglSymbol(): string {

  return "xBGL";

}



export function getAvaxSymbol(): string {

  return "AVAX";

}


