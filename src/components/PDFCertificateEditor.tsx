/**
 * PDFCertificateEditor Component
 * Displays a PDF as background with fillable overlay fields
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Loader2,
  Check,
  Eye,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/env";

interface PDFField {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  type: string;
  required: boolean;
  placeholder: string;
  value: string;
}

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  source_pdf: string;
  page_count: number;
  page_width: number;
  page_height: number;
  fields: PDFField[];
}

interface CertificateData {
  unique_identifier?: string;
  owner_name: string;
  wallet_address: string;
  email?: string;
  citizen_id?: string;
  date_of_issue?: string;
  plot_id: string;
  coordinates: string;
  zone_type: string;
  activation_date?: string;
  nft_token_id: string;
  transaction_hash: string;
  blockchain_name?: string;
  buyer_signature?: string;
  seller_signature?: string;
}

interface PDFCertificateEditorProps {
  plotData?: {
    plot_id: string | number;
    x: number;
    y: number;
    zone_type?: string;
    owner?: string;
  };
  walletAddress?: string;
  onGenerate?: (downloadUrl: string) => void;
}

export function PDFCertificateEditor({ plotData, walletAddress, onGenerate }: PDFCertificateEditorProps) {
  const [template, setTemplate] = useState<PDFTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<CertificateData>({
    owner_name: "",
    wallet_address: walletAddress || "",
    email: "",
    plot_id: plotData ? `SP-${String(plotData.plot_id).padStart(4, '0')}` : "",
    coordinates: plotData ? `${plotData.x}, ${plotData.y}` : "",
    zone_type: plotData?.zone_type || "Residential",
    nft_token_id: "",
    transaction_hash: "",
    blockchain_name: "ChaosStar Network",
  });
  const [generatedPDF, setGeneratedPDF] = useState<{
    downloadUrl: string;
    overlay: any;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const baseUrl = getApiUrl();

  // Load template
  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/pdf/template/land-ownership-certificate`);
      if (!response.ok) throw new Error("Failed to load template");
      const data = await response.json();
      setTemplate(data);
    } catch (error: any) {
      console.error("Failed to load PDF template:", error);
      toast.error("Failed to load certificate template");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Update form when plotData or walletAddress changes
  useEffect(() => {
    if (plotData) {
      setFormData(prev => ({
        ...prev,
        plot_id: `SP-${String(plotData.plot_id).padStart(4, '0')}`,
        coordinates: `${plotData.x}, ${plotData.y}`,
        zone_type: plotData.zone_type || prev.zone_type,
      }));
    }
    if (walletAddress) {
      setFormData(prev => ({
        ...prev,
        wallet_address: walletAddress,
      }));
    }
  }, [plotData, walletAddress]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${baseUrl}/api/pdf/certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate certificate");

      const data = await response.json();
      if (data.success) {
        setGeneratedPDF({
          downloadUrl: `${baseUrl}${data.download_url}`,
          overlay: data.overlay,
        });
        toast.success("Certificate generated successfully!");
        onGenerate?.(data.download_url);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("Failed to generate certificate:", error);
      toast.error(error.message || "Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = () => {
    if (generatedPDF?.downloadUrl) {
      window.open(generatedPDF.downloadUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <Card className="glass-enhanced border-primary/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-enhanced border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{template?.name || "Land Ownership Certificate"}</CardTitle>
              <CardDescription>{template?.description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <Edit3 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="ghost" size="icon" onClick={loadTemplate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {previewMode && generatedPDF ? (
          /* Preview Mode - Show PDF with overlay */
          <div className="relative bg-white rounded-lg overflow-hidden" style={{ aspectRatio: "595/842" }}>
            {/* PDF Background */}
            <iframe
              src={`${baseUrl}/api/pdf/preview/land-ownership-certificate`}
              className="w-full h-full"
              title="Certificate Preview"
            />
            
            {/* Overlay Fields */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ 
                width: template?.page_width,
                height: template?.page_height,
              }}
            >
              {generatedPDF.overlay?.fields?.map((field: any) => (
                <div
                  key={field.id}
                  className="absolute text-xs font-mono bg-yellow-100/80 border border-yellow-300 px-1 overflow-hidden"
                  style={{
                    left: `${(field.x / (template?.page_width || 595)) * 100}%`,
                    top: `${(field.y / (template?.page_height || 842)) * 100}%`,
                    width: `${(field.width / (template?.page_width || 595)) * 100}%`,
                    height: `${(field.height / (template?.page_height || 842)) * 100}%`,
                  }}
                >
                  {field.value}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Edit Mode - Form Fields */
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {/* Owner Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">I</Badge>
                  <h3 className="font-semibold">Owner Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Owner Name *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange("owner_name", e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="wallet_address">Wallet Address *</Label>
                    <Input
                      id="wallet_address"
                      value={formData.wallet_address}
                      onChange={(e) => handleInputChange("wallet_address", e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizen_id">Citizen ID</Label>
                    <Input
                      id="citizen_id"
                      value={formData.citizen_id}
                      onChange={(e) => handleInputChange("citizen_id", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">II</Badge>
                  <h3 className="font-semibold">Property Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plot_id">Plot ID *</Label>
                    <Input
                      id="plot_id"
                      value={formData.plot_id}
                      onChange={(e) => handleInputChange("plot_id", e.target.value)}
                      placeholder="SP-0042"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coordinates">Coordinates *</Label>
                    <Input
                      id="coordinates"
                      value={formData.coordinates}
                      onChange={(e) => handleInputChange("coordinates", e.target.value)}
                      placeholder="5, 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone_type">Zone Type *</Label>
                    <Input
                      id="zone_type"
                      value={formData.zone_type}
                      onChange={(e) => handleInputChange("zone_type", e.target.value)}
                      placeholder="Residential"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activation_date">Activation Date</Label>
                    <Input
                      id="activation_date"
                      type="date"
                      value={formData.activation_date}
                      onChange={(e) => handleInputChange("activation_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nft_token_id">NFT Token ID *</Label>
                    <Input
                      id="nft_token_id"
                      value={formData.nft_token_id}
                      onChange={(e) => handleInputChange("nft_token_id", e.target.value)}
                      placeholder="42"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="transaction_hash">Transaction Hash *</Label>
                    <Input
                      id="transaction_hash"
                      value={formData.transaction_hash}
                      onChange={(e) => handleInputChange("transaction_hash", e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Title Grant */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">III</Badge>
                  <h3 className="font-semibold">Title Grant</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockchain_name">Blockchain Name</Label>
                  <Input
                    id="blockchain_name"
                    value={formData.blockchain_name}
                    onChange={(e) => handleInputChange("blockchain_name", e.target.value)}
                    placeholder="ChaosStar Network"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <div className="text-sm text-muted-foreground">
            {template?.fields.filter(f => f.required).length || 0} required fields
          </div>
          <div className="flex gap-2">
            {generatedPDF && (
              <Button variant="outline" onClick={downloadCertificate}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Button onClick={generateCertificate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Generate Certificate
            </Button>
          </div>
        </div>

        {/* Generated Certificate Info */}
        {generatedPDF && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Certificate Generated!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your Land Ownership Certificate has been created. Click "Preview" to see it or "Download PDF" to save it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

