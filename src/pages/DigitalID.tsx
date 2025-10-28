import { useState, useEffect } from "react";
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

const API_URL = import.meta.env.VITE_API_URL;

const DigitalID = () => {
  const [idType, setIdType] = useState<'personal' | 'corporate' | 'organization' | null>(null);
  const [hasID, setHasID] = useState(false);

  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasID) fetchPlots();
  }, [hasID]);

  // Upload avatar to IPFS via Flask
  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    const formData = new FormData();
    formData.append("file", avatarFile);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.ipfs_hash;
    } catch (err) {
      toast.error("Failed to upload avatar");
      return null;
    }
  };

  // Create Digital ID
  const handleCreateID = async () => {
    if (!idType || !name) {
      toast.error("Name and ID type are required");
      return;
    }

    setLoading(true);
    try {
      const avatarHash = await uploadAvatar();

      const body = {
        name,
        idType,
        wallet,
        avatar: avatarHash,
      };

      const res = await fetch(`${API_URL}/api/create-digital-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.status === "success") {
        toast.success("Digital ID created!");
        setHasID(true);
        fetchPlots();
      } else {
        toast.error("Failed to create Digital ID");
      }
    } catch (err) {
      toast.error("Error creating Digital ID");
    }
    setLoading(false);
  };

  // Fetch user land ownership
  const fetchPlots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/land-ownership`);
      const data = await res.json();
      setPlots(data);
    } catch (err) {
      toast.error("Failed to fetch land ownership");
    }
  };

  // Render ID creation view
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
            {["personal", "corporate", "organization"].map((type) => {
              const label = type.charAt(0).toUpperCase() + type.slice(1);
              const Icon = type === "personal" ? User : type === "corporate" ? Building2 : Users;
              const border = idType === type ? "border-primary shadow-glow-primary" : "border-primary/30 hover:border-primary/60";
              return (
                <Card
                  key={type}
                  className={`glass p-8 cursor-pointer transition-all text-center ${border}`}
                  onClick={() => setIdType(type as any)}
                >
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type === "personal"
                      ? "Individual citizen identity"
                      : type === "corporate"
                      ? "Business entity registration"
                      : "Group or collective identity"}
                  </p>
                </Card>
              );
            })}
          </div>

          {idType && (
            <Card className="glass p-8">
              <h2 className="text-2xl font-bold mb-6">Setup Your {idType} ID</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    className="glass mt-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="avatar">NFT Avatar</Label>
                  <div className="flex gap-4 mt-2">
                    <Input
                      id="avatar"
                      type="file"
                      className="glass flex-1"
                      onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])}
                    />
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
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                  />
                </div>

                <Button
                  variant="cosmic"
                  size="lg"
                  className="w-full mt-8"
                  onClick={handleCreateID}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Digital ID"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Render dashboard view
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
              <h2 className="text-2xl font-bold mb-2">{name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{idType} ID</p>
              <div className="glass px-3 py-1 rounded-full text-xs">{wallet || "No wallet connected"}</div>
            </div>
          </Card>

          {/* Assets Overview */}
          <Card className="glass p-6 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Assets Overview
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Replace these with real balances fetched from blockchain or Supabase */}
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
            {plots.length > 0 ? (
              plots.map((plot) => (
                <div key={plot.id} className="glass p-4 rounded-lg">
                  <p className="font-bold mb-1">{plot.id}</p>
                  <p className="text-sm text-muted-foreground mb-2">{plot.location}</p>
                  <p className="text-primary font-medium">{plot.value} xBGL</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No plots owned yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DigitalID;
