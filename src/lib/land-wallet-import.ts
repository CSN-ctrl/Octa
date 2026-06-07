/**
 * Prompt MetaMask (or compatible wallet) to import a land plot ERC-1155 NFT.
 */

import { toast } from "sonner";
import { getLandNftImageUrl } from "@/lib/land-nft-metadata";
import { PAYMENT_CONTRACT_ADDRESSES } from "@/lib/payment-contracts";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

export async function requestImportLandNftToWallet(
  plotId: number,
  options?: { silent?: boolean },
): Promise<boolean> {
  const land = PAYMENT_CONTRACT_ADDRESSES.land;
  const ethereum = (typeof window !== "undefined"
    ? (window as unknown as Window & { ethereum?: EthereumProvider }).ethereum
    : undefined) as EthereumProvider | undefined;

  if (!land || !ethereum) {
    if (!options?.silent) {
      toast.error("MetaMask required to import plot NFT");
    }
    return false;
  }

  const image = getLandNftImageUrl();
  try {
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC1155",
        options: {
          address: land,
          tokenId: plotId.toString(),
          image,
        },
      },
    });
    if (!options?.silent) {
      toast.success(`Plot #${plotId} added to your wallet`);
    }
    return true;
  } catch {
    if (!options?.silent) {
      toast.message("Import plot in MetaMask", {
        description: `NFTs → Import → contract ${land}, token ID ${plotId}`,
      });
    }
    return false;
  }
}
