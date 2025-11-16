import { useEffect, useState } from "react";

export function useContractStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/verify-contract")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false }));
  }, []);

  return status;
}
