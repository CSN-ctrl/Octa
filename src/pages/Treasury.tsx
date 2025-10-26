import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight 
} from "lucide-react";

const treasuryData = {
  avax: {
    balance: 15420.5,
    change: 12.4,
    trend: 'up',
  },
  usdc: {
    balance: 284650.0,
    change: -2.1,
    trend: 'down',
  },
  xbgl: {
    balance: 1847320.0,
    change: 8.7,
    trend: 'up',
  },
};

const recentTransactions = [
  { id: 1, type: 'Land Sale', amount: '+1,250 xBGL', time: '2 hours ago' },
  { id: 2, type: 'Market Fee', amount: '+45 USDC', time: '4 hours ago' },
  { id: 3, type: 'Treasury Allocation', amount: '-500 AVAX', time: '6 hours ago' },
  { id: 4, type: 'Land Sale', amount: '+890 xBGL', time: '8 hours ago' },
  { id: 5, type: 'Staking Reward', amount: '+120 xBGL', time: '12 hours ago' },
];

const Treasury = () => {
  const totalValue = treasuryData.avax.balance * 45 + treasuryData.usdc.balance + treasuryData.xbgl.balance * 0.05;

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Treasury Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor ecosystem funds and financial health in real-time
          </p>
        </div>

        {/* Total Value Card */}
        <Card className="glass p-8 mb-8 border-animated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-2">Total Treasury Value</p>
              <p className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-6 rounded-full bg-primary/10 border border-primary/30">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-xl font-bold">$42,150</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Plots</p>
              <p className="text-xl font-bold">2,658</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Citizens</p>
              <p className="text-xl font-bold">5,247</p>
            </div>
          </div>
        </Card>

        {/* Asset Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/30">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                treasuryData.avax.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {treasuryData.avax.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(treasuryData.avax.change)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">AVAX Balance</p>
            <p className="text-3xl font-bold mb-4">
              {treasuryData.avax.balance.toLocaleString()}
            </p>
            <Progress value={65} className="h-2" />
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-accent/10 border border-accent/30">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                treasuryData.usdc.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {treasuryData.usdc.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(treasuryData.usdc.change)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">USDC Balance</p>
            <p className="text-3xl font-bold mb-4">
              {treasuryData.usdc.balance.toLocaleString()}
            </p>
            <Progress value={82} className="h-2" />
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-secondary/10 border border-secondary/30">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                treasuryData.xbgl.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {treasuryData.xbgl.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(treasuryData.xbgl.change)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">xBGL Balance</p>
            <p className="text-3xl font-bold mb-4">
              {treasuryData.xbgl.balance.toLocaleString()}
            </p>
            <Progress value={45} className="h-2" />
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="glass p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="glass p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-sm text-muted-foreground">{tx.time}</p>
                </div>
                <div className={`text-lg font-bold ${
                  tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Treasury;
