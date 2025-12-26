import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Wallet,
  Loader2,
  Eye,
  Printer,
  ExternalLink,
  Copy,
  Check,
  Home,
  Grid3X3,
  Hash,
} from "lucide-react";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useWallet } from "@/contexts/WalletContext";
import { generateDeedPDF } from "@/lib/deedPdf";
import { toast } from "sonner";
import { getApiUrl } from "@/env";

export default function PurchaseConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address } = useWallet();
  const { digitalID, hasDigitalID, loading: idLoading, checkDigitalID } = useDigitalID();
  
  const plotId = searchParams.get("plotId");
  const txHash = searchParams.get("txHash");
  const price = searchParams.get("price");
  const currency = searchParams.get("currency") || "AVAX";
  const x = searchParams.get("x") || "0";
  const y = searchParams.get("y") || "0";
  const zoneType = searchParams.get("zone") || "Residential";
  
  const [generatingDeed, setGeneratingDeed] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  
  const baseUrl = getApiUrl();

  useEffect(() => {
    if (address) {
      checkDigitalID();
    }
  }, [address, checkDigitalID]);

  // Auto-generate certificate when page loads
  useEffect(() => {
    if (plotId && txHash && address && !generatedCertificate) {
      generateCertificate();
    }
  }, [plotId, txHash, address]);

  const generateCertificate = async () => {
    if (!plotId || !address) {
      return;
    }

    setGeneratingDeed(true);
    try {
      const response = await fetch(`${baseUrl}/api/pdf/certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name: digitalID ? `${digitalID.firstName} ${digitalID.lastName}` : "",
          wallet_address: address,
          email: digitalID?.email || "",
          plot_id: `SP-${String(plotId).padStart(4, '0')}`,
          coordinates: `${x}, ${y}`,
          zone_type: zoneType,
          activation_date: new Date().toISOString().split('T')[0],
          nft_token_id: plotId,
          transaction_hash: txHash,
          blockchain_name: "ChaosStar Network",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate certificate");

      const data = await response.json();
      if (data.success) {
        setGeneratedCertificate({
          downloadUrl: `${baseUrl}${data.download_url}`,
          overlay: data.overlay,
          certificateId: data.certificate_id || data.overlay?.fields?.find((f: any) => f.id === "unique_identifier")?.value,
        });
      }
    } catch (error: any) {
      console.error("Error generating certificate:", error);
    } finally {
      setGeneratingDeed(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (generatedCertificate?.downloadUrl) {
      window.open(generatedCertificate.downloadUrl, "_blank");
      toast.success("Certificate download started!");
    }
  };

  const handlePrintDeed = async () => {
    if (!plotId || !address) {
      toast.error("Missing information for deed generation");
      return;
    }

    setGeneratingDeed(true);
    try {
      // Generate deed PDF using the old method as fallback
      const pdfBytes = await generateDeedPDF(
        "https://via.placeholder.com/800x600.pdf",
        {
          plotId: plotId,
          owner: address,
          location: `Sarakt Prime - Plot #${plotId}`,
          price: parseFloat(price || "0"),
          date: new Date().toLocaleDateString(),
          ipfs: `ipfs://QmSarakt/${plotId}.json`
        }
      );

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deed-plot-${plotId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Deed downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating deed:", error);
      toast.error("Failed to generate deed PDF");
    } finally {
      setGeneratingDeed(false);
    }
  };

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopiedTx(true);
      toast.success("Transaction hash copied!");
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  if (!plotId || !txHash) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="glass p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-3xl font-bold mb-4">Invalid Purchase Data</h1>
            <p className="text-muted-foreground mb-6">
              Missing purchase information. Please try purchasing again.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Purchase Confirmation</h1>
        </div>

        {/* Digital ID Status */}
        <Card className={hasDigitalID ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {idLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : hasDigitalID ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
                Digital ID Status
              </CardTitle>
              {hasDigitalID ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Optional
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {idLoading ? (
              <p className="text-muted-foreground">Checking Digital ID...</p>
            ) : hasDigitalID ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {digitalID?.firstName} {digitalID?.lastName}
                  </span>
                </div>
                {digitalID?.email && (
                  <div className="text-sm text-muted-foreground">
                    {digitalID.email}
                  </div>
                )}
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Your Digital ID is active. Your plot purchase is confirmed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  A Digital ID is optional but recommended for enhanced features and identity verification.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/digital-id?redirect=/purchase-confirmation", { 
                    state: { plotId, txHash, price, currency } 
                  })}
                >
                  <User className="h-4 w-4 mr-2" />
                  Create Digital ID (Optional)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Purchase Details */}
          <div className="space-y-6">
            {/* Purchase Success Card */}
            <Card className="glass border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Purchase Successful!
                </CardTitle>
                <CardDescription>Your plot has been recorded on the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Grid3X3 className="h-3 w-3" />
                      Plot ID
                    </div>
                    <p className="text-2xl font-bold text-primary">#{plotId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Wallet className="h-3 w-3" />
                      Price Paid
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {price} {currency}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Plot Location */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Plot Location
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded bg-background/50 text-center">
                      <div className="text-xs text-muted-foreground">X</div>
                      <div className="font-bold">{x}</div>
                    </div>
                    <div className="p-2 rounded bg-background/50 text-center">
                      <div className="text-xs text-muted-foreground">Y</div>
                      <div className="font-bold">{y}</div>
                    </div>
                    <div className="p-2 rounded bg-background/50 text-center">
                      <div className="text-xs text-muted-foreground">Zone</div>
                      <div className="font-bold truncate">{zoneType}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transaction Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      Transaction Hash
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyTxHash} className="h-6 px-2">
                      {copiedTx ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs bg-background/50 p-2 rounded block break-all font-mono">
                    {txHash}
                  </code>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Purchase Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Added to your Primary Portfolio</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/financial-hub")}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                View Portfolio
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/plots")}
                className="flex-1"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Browse Plots
              </Button>
            </div>
          </div>

          {/* Right Column - Certificate */}
          <div className="space-y-6">
            {/* Land Ownership Certificate */}
            <Card className="glass border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Land Ownership Certificate
                </CardTitle>
                <CardDescription>Official proof of ownership on ChaosStar Network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatingDeed && !generatedCertificate ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Generating certificate...</p>
                    </div>
                  </div>
                ) : generatedCertificate ? (
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="details">
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      {/* PDF Preview */}
                      <div className="relative rounded-lg overflow-hidden border border-primary/20 bg-white">
                        <iframe
                          src={`${baseUrl}/api/pdf/preview/land-ownership-certificate`}
                          className="w-full h-[400px]"
                          title="Certificate Preview"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {generatedCertificate.overlay?.fields?.map((field: any) => (
                            field.value && (
                              <div key={field.id} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                                <div className="font-medium text-sm break-all">{field.value}</div>
                              </div>
                            )
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Certificate will be generated automatically</p>
                    <Button variant="outline" className="mt-4" onClick={generateCertificate}>
                      Generate Now
                    </Button>
                  </div>
                )}

                {/* Certificate Actions */}
                {generatedCertificate && (
                  <div className="flex gap-3 pt-4 border-t border-primary/20">
                    <Button
                      variant="cosmic"
                      onClick={handleDownloadCertificate}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                )}

                {/* Certificate ID */}
                {generatedCertificate?.certificateId && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Certificate ID</div>
                    <code className="text-sm font-mono font-bold text-primary">
                      {generatedCertificate.certificateId}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

