import { useCallback, useEffect, useState } from "react";
import {
  getBasicResidentialEligibility,
  type BasicResidentialEligibility,
} from "@/lib/basic-residential-eligibility";

export function useBasicResidentialEligibility(enabled = true) {
  const [eligibility, setEligibility] = useState<BasicResidentialEligibility | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      setEligibility(await getBasicResidentialEligibility());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load eligibility");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { eligibility, loading, error, refresh };
}
