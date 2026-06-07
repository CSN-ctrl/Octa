import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, FlaskConical } from "lucide-react";
import { PAYMENT_CHAIN_ID } from "@/config/payment-network";
import { getPaymentNetworkName } from "@/config/blockchain-profile";
import { isOnChainCryptoMode } from "@/lib/chain-network";

const FUJI_FAUCET_URL = "https://faucet.avax.network/";

/**
 * Visible on payment flows during Phase 1 (Fuji testnet).
 */
export function FujiTestnetBanner({ className }: { className?: string }) {
  if (!isOnChainCryptoMode() || PAYMENT_CHAIN_ID !== 43113) return null;

  return (
    <Alert
      className={className ?? "mb-6 border-amber-500/40 bg-amber-500/10"}
      role="status"
    >
      <FlaskConical className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-200">Testnet — {getPaymentNetworkName()}</AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground space-y-2">
        <p>
          Phase 1 runs on Avalanche Fuji (chain {PAYMENT_CHAIN_ID}). AVAX and xBGL here have no
          real-world value. Use test AVAX from the official faucet before depositing.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-500/40 hover:bg-amber-500/10"
          onClick={() => window.open(FUJI_FAUCET_URL, "_blank", "noopener,noreferrer")}
        >
          Get test AVAX
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
