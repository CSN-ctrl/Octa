import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, Loader2 } from 'lucide-react';
import type { Planet, District } from '@/types/universe';

interface BuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  district?: District;
  planet?: Planet;
  quantity: number;
  wallet: number;
  isProcessing: boolean;
  onConfirm: () => void;
}

export function BuyDialog({
  open,
  onOpenChange,
  district,
  planet,
  quantity,
  wallet,
  isProcessing,
  onConfirm
}: BuyDialogProps) {
  if (!district || !planet) return null;

  const totalCost = district.price * quantity;
  const canAfford = wallet >= totalCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass backdrop-blur-2xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Confirm Land Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {district.icon && <district.icon className="w-5 h-5 text-purple-300" />}
              </div>
              <div>
                <p className="font-semibold">{district.name}</p>
                <p className="text-sm text-white/60">{planet.name}</p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-3 mt-4">
              <div className="flex justify-between">
                <span className="text-white/70">Quantity</span>
                <span className="font-bold">{quantity} plot{quantity > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Price per plot</span>
                <span className="font-bold">{district.price} xBGL</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-white/80">Total Cost</span>
                <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {totalCost.toLocaleString()} xBGL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Wallet Balance</span>
            <span className={canAfford ? "text-green-400" : "text-red-400"}>
              {wallet.toLocaleString()} xBGL
            </span>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing || !canAfford}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
