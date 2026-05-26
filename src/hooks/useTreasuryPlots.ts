import { useCallback, useState } from "react";
import { fetchRegisteredPlotIds, getTreasuryPlotRecord, type TreasuryPlotRecord } from "@/lib/treasury-plots";
import { loadPaymentContractAddresses, PAYMENT_CONTRACT_ADDRESSES } from "@/lib/payment-contracts";
import { formatPaymentXbglBalance } from "@/lib/payment-balance";

export function useTreasuryPlots() {
  const [loading, setLoading] = useState(false);
  const [plots, setPlots] = useState<TreasuryPlotRecord[]>([]);
  const [treasuryXbglBalance, setTreasuryXbglBalance] = useState<string>("0");

  const refresh = useCallback(async (plotIds: number[]) => {
    setLoading(true);
    try {
      await loadPaymentContractAddresses();
      const registered = await fetchRegisteredPlotIds(plotIds);
      setPlots(registered);

      const treasury = PAYMENT_CONTRACT_ADDRESSES.treasury;
      if (treasury) {
        const { formatted } = await formatPaymentXbglBalance(treasury);
        setTreasuryXbglBalance(formatted);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlot = useCallback(async (plotId: number) => getTreasuryPlotRecord(plotId), []);

  return {
    loading,
    plots,
    treasuryXbglBalance,
    refresh,
    getPlot,
    treasuryAddress: PAYMENT_CONTRACT_ADDRESSES.treasury,
    xbglAddress: PAYMENT_CONTRACT_ADDRESSES.xbglToken,
  };
}
