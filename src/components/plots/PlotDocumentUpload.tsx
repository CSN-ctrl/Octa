import { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PlotDocumentUploadProps {
  plotId: number;
  plotData: {
    coord_x: number;
    coord_y: number;
    zone_type?: string;
    owner_wallet?: string;
  };
  onUploadComplete?: () => void;
}

export function PlotDocumentUpload({ plotId, plotData, onUploadComplete }: PlotDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerEmail: "",
    purchasePrice: "100",
    purchaseDate: new Date().toISOString().split('T')[0],
    transactionHash: "",
    additionalNotes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateDocument = async () => {
    if (!formData.ownerName || !formData.ownerEmail) {
      toast.error("Please fill in owner name and email");
      return;
    }

    setUploading(true);
    try {
      // Load the template PDF
      const templatePath = "/documents/LandOwnershipTitleCertificate.pdf";
      const templateResponse = await fetch(templatePath);
      
      if (!templateResponse.ok) {
        throw new Error("Failed to load PDF template");
      }
      
      const templateBytes = await templateResponse.arrayBuffer();
      
      // Load the PDF template
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Define text positions (adjust based on your PDF template)
      // These coordinates are approximate - you may need to adjust them
      const textColor = rgb(0, 0, 0);
      const primaryColor = rgb(0.4, 0.3, 0.9);
      
      // Layer information on top of the template
      // Plot ID - adjust x, y based on your template
      firstPage.drawText(`Plot #${plotId}`, {
        x: 100,
        y: 700,
        size: 16,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      
      // Owner Name
      firstPage.drawText(formData.ownerName, {
        x: 100,
        y: 650,
        size: 14,
        font: helveticaBoldFont,
        color: textColor,
      });
      
      // Owner Email
      firstPage.drawText(formData.ownerEmail, {
        x: 100,
        y: 620,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      // Coordinates
      firstPage.drawText(`Coordinates: (${plotData.coord_x}, ${plotData.coord_y})`, {
        x: 100,
        y: 580,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      // Zone Type
      if (plotData.zone_type) {
        firstPage.drawText(`Zone: ${plotData.zone_type}`, {
          x: 100,
          y: 550,
          size: 12,
          font: helveticaFont,
          color: textColor,
        });
      }
      
      // Purchase Price
      firstPage.drawText(`Purchase Price: ${formData.purchasePrice} xBGL`, {
        x: 100,
        y: 520,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      // Purchase Date
      firstPage.drawText(`Purchase Date: ${new Date(formData.purchaseDate).toLocaleDateString()}`, {
        x: 100,
        y: 490,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      // Transaction Hash (if provided)
      if (formData.transactionHash) {
        firstPage.drawText(`Transaction: ${formData.transactionHash.slice(0, 20)}...`, {
          x: 100,
          y: 460,
          size: 10,
          font: helveticaFont,
          color: textColor,
        });
      }
      
      // Additional Notes (if provided) - split into multiple lines if needed
      if (formData.additionalNotes) {
        const notesLines = formData.additionalNotes.split('\n').slice(0, 3);
        notesLines.forEach((line, index) => {
          if (line.trim()) {
            firstPage.drawText(line.trim().slice(0, 60), {
              x: 100,
              y: 420 - (index * 20),
              size: 10,
              font: helveticaFont,
              color: textColor,
            });
          }
        });
      }
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const filename = `Plot_${plotId}_Title_Certificate_${Date.now()}.pdf`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("plot-certificates")
        .upload(`${plotId}/${filename}`, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      
      if (uploadError) {
        // If bucket doesn't exist, try to create a blob URL as fallback
        console.error("Storage upload error:", uploadError);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        
        // Save document record with blob URL
        await supabase.from("plot_documents").insert({
          plot_id: plotId,
          owner_wallet: plotData.owner_wallet || "",
          document_type: "title_certificate",
          document_url: blobUrl,
          filename: filename,
          created_at: new Date().toISOString(),
        });
        
        toast.success("Document generated! (Note: Storage upload failed, using local URL)");
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("plot-certificates")
          .getPublicUrl(`${plotId}/${filename}`);
        
        // Save document record
        const { error: dbError } = await supabase.from("plot_documents").insert({
          plot_id: plotId,
          owner_wallet: plotData.owner_wallet || "",
          document_type: "title_certificate",
          document_url: urlData.publicUrl,
          filename: filename,
          created_at: new Date().toISOString(),
        });
        
        if (dbError) throw dbError;
        
        toast.success("Document generated and uploaded successfully!");
      }
      
      // Download the document
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error("Failed to generate document:", error);
      toast.error(error.message || "Failed to generate document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Title Certificate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name *</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            placeholder="Enter owner's full name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Owner Email *</Label>
          <Input
            id="ownerEmail"
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            placeholder="Enter owner's email"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price (xBGL)</Label>
            <Input
              id="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="transactionHash">Transaction Hash (Optional)</Label>
          <Input
            id="transactionHash"
            value={formData.transactionHash}
            onChange={(e) => setFormData({ ...formData, transactionHash: e.target.value })}
            placeholder="0x..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
          <textarea
            id="additionalNotes"
            className="w-full min-h-[100px] p-2 border rounded-md resize-none"
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            placeholder="Any additional information..."
          />
        </div>
        
        <Button
          onClick={handleGenerateDocument}
          disabled={uploading || !formData.ownerName || !formData.ownerEmail}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Generate & Upload Certificate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

