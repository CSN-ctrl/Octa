import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import type { District } from '@/types/universe';

export function DistrictCard({
  planetId,
  district,
  onBuy
}: {
  planetId: string;
  district: District;
  onBuy: (districtId: string, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const canBuy = planetId === "sarakt-prime" && district.plots > 0;
  const totalPrice = district.price * quantity;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass backdrop-blur-xl border-white/10 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              {district.icon && <district.icon className="w-6 h-6 text-purple-300" />}
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
              {district.type}
            </Badge>
          </div>
          <CardTitle className="text-xl text-white">{district.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <p className="text-xs text-white/60 mb-1">Available Plots</p>
              <p className="text-2xl font-bold text-white">{district.plots}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <p className="text-xs text-white/60 mb-1">Price per Plot</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {district.price} xBGL
              </p>
            </div>
          </div>

          {canBuy ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white border-white/20"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(district.plots, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center bg-white/10 border-white/20 text-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white border-white/20"
                  onClick={() => setQuantity(Math.min(district.plots, quantity + 1))}
                  disabled={quantity >= district.plots}
                >
                  +
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total Cost</span>
                <span className="font-bold text-lg text-white">{totalPrice} xBGL</span>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                onClick={() => onBuy(district.id, quantity)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy {quantity} Plot{quantity > 1 ? "s" : ""}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-white/50 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {planetId !== "sarakt-prime" ? "Sales not active yet" : "Sold out"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
