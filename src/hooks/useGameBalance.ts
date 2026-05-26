import { useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { loadUserBalanceForUi } from "@/lib/onchain-crypto";
import { GAME_CURRENCY_SYMBOL } from "@/lib/game-currency";

/** Unified in-game balance for nav, hub, and purchase flows. */
export function useGameBalance() {
  const { address, balance, refreshBalance, isConnected } = useWallet();
  const onChain = isOnChainCryptoMode();

  const xbglDisplay = parseFloat(balance) || 0;

  const refreshFull = useCallback(async () => {
    await refreshBalance();
    if (!address) return null;
    return loadUserBalanceForUi(address);
  }, [address, refreshBalance]);

  return {
    address,
    isConnected,
    onChain,
    symbol: GAME_CURRENCY_SYMBOL,
    xbglBalance: xbglDisplay,
    formattedXbgl: xbglDisplay.toFixed(4),
    refreshBalance: refreshFull,
  };
}
