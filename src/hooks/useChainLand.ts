import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { addLocalAvaxNetwork } from "@/lib/wallet";
import { toast } from "sonner";
import { getLandMetadataBaseUri } from "@/lib/land-nft-metadata";
import { requestImportLandNftToWallet } from "@/lib/land-wallet-import";
import { fetchChainLandHoldings } from "@/lib/chain-land-holdings";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import {
  getPaymentLandContract,
  getPaymentXbglTokenContract,
  hasPaymentLandContract,
  loadPaymentContractAddresses,
  PAYMENT_CONTRACT_ADDRESSES,
} from "@/lib/payment-contracts";
import { PAYMENT_CHAIN_ID } from "@/config/payment-network";

export function useChainLand() {
  const { address, signer, isConnected, walletProvider } = useWallet();
  const [loading, setLoading] = useState(false);
  const [salesActive, setSalesActive] = useState(false);
  const [phase1PriceWei, setPhase1PriceWei] = useState<bigint>(0n);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [mintedPlotIds, setMintedPlotIds] = useState<number[]>([]);
  const [pendingPlotIds, setPendingPlotIds] = useState<number[]>([]);

  const refresh = useCallback(async () => {
    await loadPaymentContractAddresses();
    if (!hasPaymentLandContract()) return;
    const contract = getPaymentLandContract();
    if (!contract) return;

    setLoading(true);
    try {
      if (!address) {
        const [active, priceUsdc, owner] = await Promise.all([
          contract.salesActive(),
          contract.phase1PriceUSDC().catch(() => 0n),
          contract.owner(),
        ]);
        setSalesActive(active);
        setPhase1PriceWei(
          priceUsdc > 0n ? priceUsdc : ethers.parseEther(getPlotPriceInXBGL().toString())
        );
        setContractOwner(owner);
        setMintedPlotIds([]);
        setPendingPlotIds([]);
        return;
      }

      const holdings = await fetchChainLandHoldings(address);
      setSalesActive(holdings.salesActive);
      setPhase1PriceWei(holdings.phase1PriceWei);
      setContractOwner(holdings.contractOwner);
      setMintedPlotIds(holdings.mintedPlotIds);
      setPendingPlotIds(holdings.pendingPlotIds);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load land";
      console.error(msg, e);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void loadPaymentContractAddresses().then(() => refresh());
  }, [refresh, isConnected]);

  const ensurePaymentNetwork = useCallback(async () => {
    const target =
      walletProvider || (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (target) {
      await addLocalAvaxNetwork(target);
    }
  }, [walletProvider]);

  /** Land is priced and paid in xBGL only (phase1PriceUSDC slot). */
  const resolvePlotPriceWei = useCallback(async (contract: ethers.Contract) => {
    const onChain = await contract.phase1PriceUSDC().catch(() => 0n);
    if (onChain > 0n) return onChain;
    return ethers.parseEther(getPlotPriceInXBGL().toString());
  }, []);

  /** Pay with xBGL ERC-20 on chain 1337 (after AVAX → xBGL deposit). */
  const buyPlotWithXbgl = useCallback(
    async (plotId: number) => {
      if (!signer) throw new Error("Connect wallet first");
      await ensurePaymentNetwork();
      await loadPaymentContractAddresses();

      const contract = getPaymentLandContract(signer);
      if (!contract) throw new Error("Land contract not configured on payment network");

      const xbgl = PAYMENT_CONTRACT_ADDRESSES.xbglToken;
      if (!xbgl || !ethers.isAddress(xbgl)) {
        throw new Error("xBGL token not configured for payment network");
      }

      const price = await resolvePlotPriceWei(contract);
      const erc20 = getPaymentXbglTokenContract(signer);
      if (!erc20) throw new Error("xBGL token contract unavailable");

      const allowance = await erc20.allowance(await signer.getAddress(), contract.target);
      if (allowance < price) {
        const approveTx = await erc20.approve(contract.target, price);
        await approveTx.wait();
      }

      let tx;
      try {
        tx = await contract.buyPlotWithUSDC(plotId, price);
      } catch (err: unknown) {
        const e = err as { message?: string };
        if (e.message?.includes("call revert") || e.message?.includes("missing revert")) {
          throw new Error(
            "Land contract must include buyPlotWithUSDC — redeploy SaraktLandV2 and setUSDC(xBGL), phase1PriceUSDC"
          );
        }
        throw err;
      }
      const receipt = await tx.wait();

      const buyer = await signer.getAddress();
      let minted = false;
      try {
        minted = (await contract.balanceOf(buyer, plotId)) > 0n;
      } catch {
        minted = false;
      }

      if (!minted) {
        try {
          const owner = await contract.owner();
          if (owner.toLowerCase() === buyer.toLowerCase()) {
            const activateTx = await contract.activatePlot(plotId, ethers.ZeroAddress);
            await activateTx.wait();
            minted = true;
          }
        } catch (activateErr) {
          console.debug("Owner activate fallback failed:", activateErr);
        }
      }

      if (minted) {
        await requestImportLandNftToWallet(plotId, { silent: true });
        toast.success(`Plot #${plotId} purchased and minted to your wallet`, {
          description: "NFT import requested in MetaMask",
        });
      } else {
        toast.success(`Plot ${plotId} paid in xBGL`, {
          description:
            "Redeploy SaraktLandV2 for instant mint, or ask the contract owner to activate.",
        });
      }

      await refresh();
      return receipt?.hash ?? (tx.hash as string);
    },
    [signer, refresh, ensurePaymentNetwork, resolvePlotPriceWei]
  );

  const activatePlot = useCallback(
    async (plotId: number) => {
      if (!signer) throw new Error("Connect wallet first");
      await ensurePaymentNetwork();
      const contract = getPaymentLandContract(signer);
      if (!contract) throw new Error("Land contract not configured");
      const tx = await contract.activatePlot(plotId, ethers.ZeroAddress);
      await tx.wait();
      toast.success(`Plot ${plotId} minted to your wallet`);
      await refresh();
      return tx.hash as string;
    },
    [signer, refresh, ensurePaymentNetwork]
  );

  const importPlotToMetaMask = useCallback(
    async (plotId: number) => {
      await requestImportLandNftToWallet(plotId);
    },
    [],
  );

  const setLandMetadataUri = useCallback(
    async (origin?: string) => {
      if (!signer) throw new Error("Connect wallet first");
      await ensurePaymentNetwork();
      const contract = getPaymentLandContract(signer);
      if (!contract) throw new Error("Land contract not configured");
      const base = getLandMetadataBaseUri(origin);
      const tx = await contract.setMetadataURI(base);
      await tx.wait();
      toast.success("NFT metadata URI updated", {
        description: base,
      });
      return tx.hash as string;
    },
    [signer, ensurePaymentNetwork]
  );

  const isContractOwner =
    !!address &&
    !!contractOwner &&
    address.toLowerCase() === contractOwner.toLowerCase();

  const wrongChainHint = isConnected ? `Plot payments use chain ${PAYMENT_CHAIN_ID}` : null;

  return {
    loading,
    salesActive,
    phase1PriceWei,
    contractOwner,
    mintedPlotIds,
    pendingPlotIds,
    isContractOwner,
    wrongChainHint,
    landAddress: PAYMENT_CONTRACT_ADDRESSES.land,
    refresh,
    buyPlotWithXbgl,
    /** @deprecated Use buyPlotWithXbgl */
    buyPlotWithAvax: buyPlotWithXbgl,
    activatePlot,
    importPlotToMetaMask,
    setLandMetadataUri,
    hasContract: hasPaymentLandContract(),
  };
}
