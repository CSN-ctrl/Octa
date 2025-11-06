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
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useLandPlots } from "@/hooks/useLandPlots";
import { ethers } from "ethers";
import { formatEther } from "ethers";

const DigitalID = () => {
  const { address, signer, isConnected, balance, connect } = useWallet();
  const { digitalID, hasDigitalID, loading: idLoading, registerDigitalID } = useDigitalID();
  const { userPlots, loading: plotsLoading } = useLandPlots();
  
  const [idType, setIdType] = useState<'personal' | 'corporate' | 'organization' | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [registering, setRegistering] = useState(false);

  // Email hash function (simple hash for demo - in production use proper hashing)
  const hashEmail = (email: string): string => {
    // Simple hash - in production use proper cryptographic hash
    return ethers.id(email.toLowerCase().trim());
  };

  const handleCreateID = async () => {
    if (!isConnected || !signer) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }

    if (!idType || !username || !email) {
      toast.error("All fields are required");
      return;
    }

    setRegistering(true);
    try {
      const emailHash = hashEmail(email);
      const txHash = await registerDigitalID(username, emailHash);
      toast.success(`Digital ID registered! TX: ${txHash.slice(0, 10)}...`);
      setUsername("");
      setEmail("");
      setIdType(null);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register Digital ID");
    } finally {
      setRegistering(false);
    }
  };

  // Render wallet connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="glass p-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect your wallet to create and manage your Digital ID
            </p>
            <Button variant="cosmic" size="lg" onClick={() => connect()}>
              <Wallet className="h-5 w-5 mr-2" />
              Connect Wallet
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Render ID creation view if no ID exists
  if (!hasDigitalID) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
              Create Your Digital ID
            </h1>
            <p className="text-xl text-muted-foreground">
              Register your identity on-chain to participate in the Sarakt Universe
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Wallet: {address?.slice(0, 10)}...{address?.slice(-8)}
            </div>
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
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="glass mt-2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="glass mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your email will be hashed and stored on-chain for privacy
                  </p>
                </div>

                <div>
                  <Label htmlFor="avatar">Avatar (Optional)</Label>
                  <div className="flex gap-4 mt-2">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="glass flex-1"
                      onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])}
                    />
                  </div>
                  {avatarFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {avatarFile.name}
                    </p>
                  )}
                </div>

                <Button
                  variant="cosmic"
                  size="lg"
                  className="w-full mt-8"
                  onClick={handleCreateID}
                  disabled={registering || !username || !email}
                >
                  {registering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Digital ID"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Render dashboard view if ID exists
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
              Digital ID Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-muted-foreground">ID Active</span>
            </div>
          </div>
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
              <h2 className="text-2xl font-bold mb-2">{digitalID?.username || "Unknown"}</h2>
              <p className="text-sm text-muted-foreground mb-4">Digital ID</p>
              <div className="glass px-3 py-1 rounded-full text-xs mb-2">
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </div>
              <div className="text-xs text-muted-foreground">
                Registered: {digitalID?.registeredAt 
                  ? new Date(Number(digitalID.registeredAt) * 1000).toLocaleDateString()
                  : "N/A"}
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
                <p className="text-sm text-muted-foreground mb-1">AVAX Balance</p>
                <p className="text-2xl font-bold text-primary">
                  {parseFloat(balance).toFixed(4)}
                </p>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Land Plots</p>
                <p className="text-2xl font-bold text-accent">
                  {userPlots.length}
                </p>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-2xl font-bold text-green-500">
                  {hasDigitalID ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Land Ownership */}
        <Card className="glass p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Land Ownership ({userPlots.length} plots)
          </h3>
          {plotsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : userPlots.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPlots.map((plotId) => (
                <div key={plotId} className="glass p-4 rounded-lg">
                  <p className="font-bold mb-1">SP-{String(plotId).padStart(4, "0")}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sarakt Prime - District {((plotId - 1) % 10) + 1}
                  </p>
                  <p className="text-primary font-medium">Plot #{plotId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No plots owned yet. Visit the Marketplace to purchase land.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DigitalID;
