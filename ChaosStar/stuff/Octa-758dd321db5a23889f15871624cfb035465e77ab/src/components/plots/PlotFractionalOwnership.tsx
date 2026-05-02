import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PieChart,
  Users,
  Plus,
  Loader2,
  X,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as supabaseService from "@/lib/supabase-service";

interface PlotFractionalOwnershipProps {
  plotId: number;
  onUpdate?: () => void;
}

interface FractionalShare {
  id?: string;
  plot_id: number;
  owner_email: string;
  owner_wallet?: string;
  share_percentage: number;
  shares: number;
  total_shares: number;
  created_at?: string;
}

export function PlotFractionalOwnership({ plotId, onUpdate }: PlotFractionalOwnershipProps) {
  const [shares, setShares] = useState<FractionalShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newShareEmail, setNewShareEmail] = useState("");
  const [newSharePercentage, setNewSharePercentage] = useState("");
  const [totalShares, setTotalShares] = useState(10000); // Default: 10,000 shares
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadShares();
    fetchUserEmail();
  }, [plotId]);

  const fetchUserEmail = async () => {
    try {
      const email = await supabaseService.getAuthUserEmail();
      setUserEmail(email);
    } catch (error) {
      console.debug("Failed to get user email:", error);
    }
  };

  const loadShares = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plot_fractional_shares")
        .select("*")
        .eq("plot_id", plotId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setShares(data || []);
      
      // Calculate total shares from existing shares
      if (data && data.length > 0) {
        const total = data.reduce((sum, share) => sum + (share.shares || 0), 0);
        setTotalShares(Math.max(total, 10000)); // Minimum 10,000 shares
      }
    } catch (error: any) {
      console.error("Failed to load fractional shares:", error);
      // Table might not exist yet, that's okay
      setShares([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShare = async () => {
    if (!newShareEmail || !newSharePercentage) {
      toast.error("Please fill in all fields");
      return;
    }

    const percentage = parseFloat(newSharePercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error("Please enter a valid percentage (0-100)");
      return;
    }

    // Check if total shares would exceed 100%
    const currentTotal = shares.reduce((sum, share) => sum + share.share_percentage, 0);
    if (currentTotal + percentage > 100) {
      toast.error(`Total ownership cannot exceed 100%. Current: ${currentTotal.toFixed(2)}%`);
      return;
    }

    setAdding(true);
    try {
      const shareCount = Math.floor((percentage / 100) * totalShares);

      const { error } = await supabase
        .from("plot_fractional_shares")
        .insert({
          plot_id: plotId,
          owner_email: newShareEmail.toLowerCase(),
          share_percentage: percentage,
          shares: shareCount,
          total_shares: totalShares,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success(`Added ${percentage}% ownership to ${newShareEmail}`);
      setNewShareEmail("");
      setNewSharePercentage("");
      setShowDialog(false);
      await loadShares();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Failed to add fractional share:", error);
      toast.error(error.message || "Failed to add fractional share");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("plot_fractional_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;

      toast.success("Share removed");
      await loadShares();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Failed to remove share:", error);
      toast.error(error.message || "Failed to remove share");
    }
  };

  const totalOwnership = shares.reduce((sum, share) => sum + share.share_percentage, 0);
  const availablePercentage = 100 - totalOwnership;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Fractional Ownership
            </CardTitle>
            <CardDescription>
              Manage fractional ownership shares for Plot #{plotId}
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fractional Share</DialogTitle>
                <DialogDescription>
                  Add a new owner to this plot with a percentage share
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shareEmail">Owner Email</Label>
                  <Input
                    id="shareEmail"
                    type="email"
                    placeholder="owner@example.com"
                    value={newShareEmail}
                    onChange={(e) => setNewShareEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sharePercentage">Ownership Percentage</Label>
                  <Input
                    id="sharePercentage"
                    type="number"
                    placeholder="25.5"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newSharePercentage}
                    onChange={(e) => setNewSharePercentage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {availablePercentage.toFixed(2)}%
                  </p>
                </div>
                <Button
                  onClick={handleAddShare}
                  disabled={adding || !newShareEmail || !newSharePercentage}
                  className="w-full"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Share
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fractional shares yet</p>
            <p className="text-sm mt-2">Add shares to enable fractional ownership</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">Total Ownership</span>
              </div>
              <Badge variant={totalOwnership === 100 ? "default" : "outline"}>
                {totalOwnership.toFixed(2)}%
              </Badge>
            </div>
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{share.owner_email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {share.shares.toLocaleString()} / {share.total_shares.toLocaleString()} shares
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {share.share_percentage.toFixed(2)}%
                  </Badge>
                  {userEmail && share.owner_email.toLowerCase() === userEmail.toLowerCase() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => share.id && handleRemoveShare(share.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {availablePercentage > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                {availablePercentage.toFixed(2)}% available for allocation
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

