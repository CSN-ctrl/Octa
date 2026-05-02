import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import * as supabaseService from "@/lib/supabase-service";
import { getCertificateData } from "@/lib/certificate-data";
import { LandTitleCertificateView } from "@/components/documents/LandTitleCertificateView";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Printer } from "lucide-react";
import type { LandTitleCertificateData } from "@/lib/certificate-data";
import type { Plot } from "@/integrations/supabase/types";

export default function LandTitleCertificate() {
  const [searchParams] = useSearchParams();
  const plotIdParam = searchParams.get("plotId");
  const { address } = useWallet();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [certData, setCertData] = useState<LandTitleCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setCertData(null);
      let wallet = (address || "").toLowerCase();
      let email: string | null = null;
      let name: string | null = null;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          email = session.user.email?.toLowerCase() ?? null;
          name =
            (session.user.user_metadata?.full_name as string) ||
            (session.user.user_metadata?.name as string) ||
            null;
          if (session.user.user_metadata?.wallet_address) {
            wallet = (session.user.user_metadata.wallet_address as string).toLowerCase();
          } else if (email && !wallet) {
            wallet = email;
          }
        }
        setOwnerEmail(email);
        setOwnerName(name);

        if (!wallet) {
          setPlots([]);
          setLoading(false);
          return;
        }

        const list = await supabaseService.getPlots({
          ownerWallet: wallet,
          ownerEmail: email || undefined,
        });
        setPlots(list || []);

        const idFromUrl = plotIdParam ? parseInt(plotIdParam, 10) : null;
        if (idFromUrl && list.some((p) => p.id === idFromUrl)) {
          setSelectedPlotId(idFromUrl);
        } else if (list.length > 0 && !selectedPlotId) {
          setSelectedPlotId(list[0].id);
        } else if (list.length === 0) {
          setSelectedPlotId(null);
        }
      } catch (e) {
        setPlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [address, plotIdParam]);

  useEffect(() => {
    if (!selectedPlotId || !(address || ownerEmail)) return;
    const plot = plots.find((p) => p.id === selectedPlotId);
    const ownerWallet = plot?.owner_wallet;
    if (!ownerWallet) return;
    getCertificateData(selectedPlotId, ownerWallet, {
      ownerName: ownerName ?? undefined,
      ownerEmail: ownerEmail ?? undefined,
    })
      .then(setCertData)
      .catch(() => setCertData(null));
  }, [selectedPlotId, plots, address, ownerEmail, ownerName]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!address && !ownerEmail) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Land Ownership Certificate</h2>
        <p className="text-muted-foreground mb-6">
          Connect your wallet or sign in to view and generate your land title certificate.
        </p>
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No plots found</h2>
        <p className="text-muted-foreground mb-6">
          You don’t own any plots yet. Purchase a plot to generate your land ownership certificate.
        </p>
        <Button asChild>
          <a href="/plot-purchase">Go to Plot Purchase</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {(plots.length > 1 || certData) && (
        <div className="sticky top-0 z-10 bg-background/95 border-b px-4 py-3 flex flex-wrap items-center gap-3 print:hidden">
          {plots.length > 1 && (
            <>
              <label className="text-sm font-medium">Plot for certificate:</label>
              <Select
                value={selectedPlotId != null ? String(selectedPlotId) : ""}
                onValueChange={(v) => setSelectedPlotId(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select plot" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      Plot #{p.id} ({p.coord_x}, {p.coord_y}) {p.zone_type ? ` · ${p.zone_type}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {certData && (
            <Button type="button" variant="outline" onClick={() => window.print()} className={plots.length > 1 ? "ml-auto" : ""}>
              <Printer className="h-4 w-4 mr-2" />
              Print / Save as PDF
            </Button>
          )}
        </div>
      )}
      {certData ? (
        <LandTitleCertificateView data={certData} />
      ) : selectedPlotId ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
