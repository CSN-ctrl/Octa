import { useCallback, useEffect, useState } from "react";
import { getExpatAvailability, type ExpatAvailability } from "@/lib/expat-availability";

export function useExpatAvailability() {
  const [availability, setAvailability] = useState<ExpatAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAvailability(await getExpatAvailability());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load expat availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    availability,
    loading,
    error,
    refresh,
    locked: availability ? !availability.expat_open : true,
  };
}
