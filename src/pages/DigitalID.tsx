import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Building2, 
  Users, 
  Wallet, 
  Image as ImageIcon,
  MapPin 
} from "lucide-react";
import { toast } from "sonner";

const DigitalID = () => {
  const [idType, setIdType] = useState<'personal' | 'corporate' | 'organization' | null>(null);
  const [hasID, setHasID] = useState(false);

  const handleCreateID = () => {
    setHasID(true);
    toast.success("Digital ID Created!", {
      description: "Your identity has been registered on the blockchain.",
    });
  };

  if (!hasID) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
              Create Your Digital ID
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose your identity type to get started in the Octavia Universe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card 
              className={`glass p-8 cursor-pointer transition-all text-center ${
                idType === 'personal' 
                  ? 'border-primary shadow-glow-primary' 
                  : 'border-primary/30 hover:border-primary/60'
              }`}
              onClick={() => setIdType('personal')}
            >
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/30 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personal</h3>
              <p className="text-sm text-muted-foreground">
                Individual citizen identity
              </p>
            </Card>

            <Card 
              className={`glass p-8 cursor-pointer transition-all text-center ${
                idType === 'corporate' 
                  ? 'border-accent shadow-glow-accent' 
                  : 'border-primary/30 hover:border-primary/60'
              }`}
              onClick={() => setIdType('corporate')}
            >
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-accent/10 border border-accent/30 mb-4">
                <Building2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Corporate</h3>
              <p className="text-sm text-muted-foreground">
                Business entity registration
              </p>
            </Card>

            <Card 
              className={`glass p-8 cursor-pointer transition-all text-center ${
                idType === 'organization' 
                  ? 'border-secondary shadow-glow-primary' 
                  : 'border-primary/30 hover:border-primary/60'
              }`}
              onClick={() => setIdType('organization')}
            >
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Organization</h3>
              <p className="text-sm text-muted-foreground">
                Group or collective identity
              </p>
            </Card>
          </div>

          {idType && (
            <Card className="glass p-8">
              <h2 className="text-2xl font-bold mb-6">Setup Your {idType} ID</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" className="glass mt-2" />
                </div>

                <div>
                  <Label htmlFor="avatar">NFT Avatar</Label>
                  <div className="flex gap-4 mt-2">
                    <Input id="avatar" placeholder="Upload or paste NFT URL" className="glass flex-1" />
                    <Button variant="outline">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="wallet">Cold Wallet (Optional)</Label>
                  <Input 
                    id="wallet" 
                    placeholder="0x..." 
                    className="glass mt-2"
                  />
                </div>

                <Button 
                  variant="cosmic" 
                  size="lg" 
                  className="w-full mt-8"
                  onClick={handleCreateID}
                >
                  Create Digital ID
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ID Dashboard View
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Digital ID Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your identity, assets, and land ownership
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <Card className="glass p-6 md:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-cosmic mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Citizen #1337</h2>
              <p className="text-sm text-muted-foreground mb-4">Personal ID</p>
              <div className="glass px-3 py-1 rounded-full text-xs">
                0x1234...5678
              </div>
            </div>
          </Card>

          {/* Assets Overview */}
          <Card className="glass p-6 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Assets Overview
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">xBGL Balance</p>
                <p className="text-2xl font-bold text-primary">1,250</p>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">AVAX</p>
                <p className="text-2xl font-bold text-accent">12.5</p>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">USDC</p>
                <p className="text-2xl font-bold text-secondary">5,000</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Land Ownership */}
        <Card className="glass p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Land Ownership
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'SP-0042', location: 'Sarakt Prime - District A', value: 75 },
              { id: 'SP-0156', location: 'Sarakt Prime - District B', value: 68 },
              { id: 'NX-0334', location: 'Nexus Hub - Central', value: 120 },
            ].map((plot) => (
              <div key={plot.id} className="glass p-4 rounded-lg">
                <p className="font-bold mb-1">{plot.id}</p>
                <p className="text-sm text-muted-foreground mb-2">{plot.location}</p>
                <p className="text-primary font-medium">{plot.value} xBGL</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DigitalID;
