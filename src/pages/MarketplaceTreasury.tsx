import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, TrendingUp, User, Wallet, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Pie } from "react-chartjs-2";

// ---------------- MOCK DATA ----------------
interface Listing { id:number; plotId:string; location:string; owner:string; price:number; priceChange:string; }
interface Loan { id:number; type:string; amount:number; status:'Pending'|'Approved'|'Rejected'; }
interface Bond { id:number; name:string; price:number; yield:number; purchased:boolean; }
interface UniverseAsset { id:number; type:'Planet'|'Star System'; name:string; price:number; booked:boolean; consultantEmail?:string; }

const initialListings: Listing[] = [
  { id:1, plotId:"SP-0042", location:"Sarakt Prime - District A", owner:"0x1234...5678", price:75, priceChange:"+12%" },
  { id:2, plotId:"SP-0156", location:"Sarakt Prime - District B", owner:"0x9876...4321", price:68, priceChange:"+8%" },
  { id:3, plotId:"SP-0891", location:"Sarakt Prime - District C", owner:"0xabcd...ef01", price:82, priceChange:"+15%" },
];

const treasuryData = {
  avax: { balance: 15420.5, change: 12.4, trend:'up' },
  usdc: { balance: 284650.0, change: -2.1, trend:'down' },
  xbgl: { balance: 1847320.0, change: 8.7, trend:'up' },
};

const initialLoans: Loan[] = [
  {id:1,type:'Personal Loan',amount:500,status:'Pending'},
  {id:2,type:'Asset-Backed Loan',amount:1500,status:'Approved'},
];

const initialBonds: Bond[] = [
  {id:1,name:'Sarakt Treasury Bond',price:2000,yield:5,purchased:false},
  {id:2,name:'Zythera Corp Bond',price:1200,yield:7,purchased:false},
];

const universeAssets: UniverseAsset[] = [
  { id:1, type:'Planet', name:'Sarakt Prime', price:50000, booked:false },
  { id:2, type:'Planet', name:'Zythera Station', price:75000, booked:false },
  { id:3, type:'Star System', name:'Nexus Cluster', price:200000, booked:false },
];

export default function UniverseFinancialHub() {
  const [listings,setListings] = useState<Listing[]>(initialListings);
  const [loans,setLoans] = useState<Loan[]>(initialLoans);
  const [bonds,setBonds] = useState<Bond[]>(initialBonds);
  const [universePortfolio,setUniversePortfolio] = useState<UniverseAsset[]>([]);
  const [transactions,setTransactions] = useState<{id:number,type:string,amount:string,time:string}[]>([]);

  // ---------------- HELPER FUNCTIONS ----------------
  const totalValue = treasuryData.avax.balance*45 + treasuryData.usdc.balance + treasuryData.xbgl.balance*0.05;

  const requestLoan = (loan:Loan)=>{
    loan.status='Pending';
    setLoans([...loans]);
    setTransactions(prev=>[{id:prev.length+1,type:`Loan Requested: ${loan.type}`,amount:`-${loan.amount} xBGL`,time:'Just now'}, ...prev.slice(0,4)]);
    toast.success(`Loan request submitted for ${loan.type} (demo)`);
  };

  const purchaseBond = (bond:Bond)=>{
    bond.purchased = true;
    setBonds([...bonds]);
    setTransactions(prev=>[{id:prev.length+1,type:`Bond Purchased: ${bond.name}`,amount:`-${bond.price} xBGL`,time:'Just now'}, ...prev.slice(0,4)]);
    toast.success(`Purchased bond ${bond.name} (demo)`);
  };

  const bookUniverseAsset = (asset:UniverseAsset)=>{
    asset.booked=true;
    asset.consultantEmail='advisor@saraktuniverse.com';
    setUniversePortfolio(prev=>[...prev,asset]);
    setTransactions(prev=>[{id:prev.length+1,type:`Booked ${asset.type}: ${asset.name}`,amount:`-${asset.price} xBGL`,time:'Just now'}, ...prev.slice(0,4)]);
    toast.success(`Booked ${asset.type} ${asset.name}. Consultant: ${asset.consultantEmail}`);
  };

  // ---------------- PORTFOLIO MOCK ----------------
  const portfolioAssets = [...listings.map(l=>({name:l.plotId,value:l.price})), ...universePortfolio.map(u=>({name:u.name,value:u.price}))];
  const totalInvested = portfolioAssets.reduce((acc,v)=>acc+v.value,0);
  const portfolioData = {
    labels: portfolioAssets.map(a=>a.name),
    datasets:[{data:portfolioAssets.map(a=>a.value),backgroundColor:['#f43f5e','#3b82f6','#facc15','#22c55e','#a855f7']}]
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">Sarakt Universe Financial Hub</h1>
        <p className="text-xl text-muted-foreground mb-12">Demo banking sector: Treasury, Markets, Land, Loans, Bonds, Universe Assets</p>

        <Tabs defaultValue="treasury">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="marketplace">Land</TabsTrigger>
            <TabsTrigger value="universe">Universe Market</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="investbank">Investment Banking</TabsTrigger>
          </TabsList>

          {/* ---------------- TREASURY ---------------- */}
          <TabsContent value="treasury">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="glass p-6">
                <p className="text-sm text-muted-foreground mb-1">AVAX Balance</p>
                <p className="text-3xl font-bold">{treasuryData.avax.balance.toLocaleString()}</p>
              </Card>
              <Card className="glass p-6">
                <p className="text-sm text-muted-foreground mb-1">USDC Balance</p>
                <p className="text-3xl font-bold">{treasuryData.usdc.balance.toLocaleString()}</p>
              </Card>
              <Card className="glass p-6">
                <p className="text-sm text-muted-foreground mb-1">xBGL Balance</p>
                <p className="text-3xl font-bold">{treasuryData.xbgl.balance.toLocaleString()}</p>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- MARKETS ---------------- */}
          <TabsContent value="markets">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="glass p-6">Markets demo placeholder</Card>
            </div>
          </TabsContent>

          {/* ---------------- LAND ---------------- */}
          <TabsContent value="marketplace">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(l=>(
                <Card key={l.id} className="glass p-6">
                  <h3 className="text-xl font-bold">{l.plotId}</h3>
                  <p className="text-sm text-muted-foreground">{l.location}</p>
                  <p className="text-lg font-bold mt-2">{l.price} xBGL</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ---------------- UNIVERSE ---------------- */}
          <TabsContent value="universe">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universeAssets.map(asset=>(
                <Card key={asset.id} className="glass p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">{asset.type}</p>
                    <p className="text-lg font-bold mt-2">{asset.price} xBGL</p>
                    <p className="text-sm text-muted-foreground">{asset.booked ? `Booked with: ${asset.consultantEmail}` : 'Available for booking'}</p>
                  </div>
                  <Button className="mt-4" disabled={asset.booked} onClick={()=>bookUniverseAsset(asset)}>
                    {asset.booked?'Booked':'Book with Consultant'}
                  </Button>
                </Card>
              ))}
            </div>
            <Card className="glass p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Universe Portfolio</h3>
              {universePortfolio.length===0 ? <p className="text-muted-foreground">No high-end assets booked yet.</p> : 
                <ul className="space-y-2">{universePortfolio.map(a=>(
                  <li key={a.id} className="flex justify-between"><span>{a.type}: {a.name}</span><span>{a.price} xBGL</span></li>
                ))}</ul>
              }
            </Card>
            <Card className="glass p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Advisory Alerts</h3>
              <p className="text-muted-foreground">Demo advisory: High-demand planets have +20% projected growth. Star systems recommended for strategic investment.</p>
            </Card>
          </TabsContent>

          {/* ---------------- PORTFOLIO ---------------- */}
          <TabsContent value="portfolio">
            <Card className="glass p-6">
              <h3 className="text-xl font-bold mb-4">Portfolio Overview</h3>
              <p>Total Invested: {totalInvested} xBGL</p>
              {portfolioAssets.length===0 ? <p className="text-muted-foreground">No assets yet</p> :
                <Pie data={portfolioData} />
              }
            </Card>
          </TabsContent>

          {/* ---------------- INVESTMENT BANKING ---------------- */}
          <TabsContent value="investbank">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass p-6">
                <h3 className="text-xl font-bold mb-4">Loans</h3>
                {loans.map(l=>(
                  <div key={l.id} className="glass p-4 rounded-lg flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">{l.type}</p>
                      <p className="text-sm text-muted-foreground">{l.amount} xBGL - {l.status}</p>
                    </div>
                    <Button disabled={l.status!=='Pending'} onClick={()=>requestLoan(l)}>Request</Button>
                  </div>
                ))}
              </Card>
              <Card className="glass p-6">
                <h3 className="text-xl font-bold mb-4">Bonds & IPOs</h3>
                {bonds.map(b=>(
                  <div key={b.id} className="glass p-4 rounded-lg flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">Price: {b.price} xBGL | Yield: {b.yield}%</p>
                    </div>
                    <Button disabled={b.purchased} onClick={()=>purchaseBond(b)}>{b.purchased?'Purchased':'Buy'}</Button>
                  </div>
                ))}
              </Card>
            </div>
            <Card className="glass p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Wealth Management (Demo)</h3>
              <p className="text-muted-foreground">Simulated advice: Diversify holdings across land, planets, bonds, and treasury assets. High-end investors should consider universe assets for long-term growth.</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ---------------- RECENT TRANSACTIONS ---------------- */}
        <Card className="glass p-6 mt-12">
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.length===0 ? <p className="text-muted-foreground">No transactions yet.</p> :
              transactions.map(tx=>(
                <div key={tx.id} className="glass p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className={`text-lg font-bold ${tx.amount.startsWith('+')?'text-green-400':'text-red-400'}`}>{tx.amount}</div>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
