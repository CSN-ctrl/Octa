/** xBGL ERC-20 balance on payment rail (chain 1337). */

import { ethers } from "ethers";
import { getPaymentJsonRpcProvider } from "@/lib/evm-provider";
import {
  loadPaymentContractAddresses,
  PAYMENT_CONTRACT_ADDRESSES,
} from "@/lib/payment-contracts";

export async function formatPaymentXbglBalance(
  walletAddress: string
): Promise<{ formatted: string; wei: bigint }> {
  await loadPaymentContractAddresses();
  const token = PAYMENT_CONTRACT_ADDRESSES.xbglToken;
  if (!token || !ethers.isAddress(token)) {
    return { formatted: "0", wei: 0n };
  }
  const provider = getPaymentJsonRpcProvider();
  const erc20 = new ethers.Contract(
    token,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );
  const wei: bigint = await erc20.balanceOf(walletAddress);
  return { formatted: ethers.formatUnits(wei, 18), wei };
}
