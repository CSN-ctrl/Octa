import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PlotSell as PlotSellComponent } from "@/components/plots/PlotSell";

export default function PlotSell() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text">
                Sell/Transfer Plots
              </h1>
              <p className="text-muted-foreground mt-1">
                Transfer your plots to another address
              </p>
            </div>
          </div>
          <div className="w-[72px] shrink-0" /> {/* Spacer to balance Back button */}
        </div>

        {/* PlotSell Component */}
        <PlotSellComponent 
          onTransferComplete={() => {
            // Optionally navigate or show success message
            console.log("Transfer completed");
          }}
        />
      </div>
    </div>
  );
}

