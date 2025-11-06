import { useState } from "react";
import { 
  User, 
  Building2, 
  Users, 
  Wallet, 
  MapPin, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/contexts/WalletContext";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useLandPlots } from "@/hooks/useLandPlots";
import { toast } from "sonner";
import { ethers } from "ethers";

const DigitalID = () => {
  const { address, signer, isConnected, balance, connect } = useWallet();
  const { digitalID, hasDigitalID, registerDigitalID } = useDigitalID();
  const { userPlots, loading: plotsLoading } = useLandPlots();

  const [idType, setIdType] = useState<'personal' | 'corporate' | 'organization' | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [registering, setRegistering] = useState(false);

  const hashEmail = (email: string): string => ethers.id(email.toLowerCase().trim());

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
      toast.error(error.message || "Failed to register Digital ID");
    } finally {
      setRegistering(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="relative w-[300px] h-[400px] border border-solid border-white/40 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 p-1 bg-purple-400">
            <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-[#111]" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center backdrop-blur-lg rounded-2xl">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-orange-300 animate-spin" style={{ animationDuration: "12s" }} />
            <h2 className="text-3xl mt-6 font-bold bg-gradient-to-r from-purple-400 to-orange-300 bg-clip-text text-transparent">Connect Wallet</h2>
            <p className="text-sm text-gray-400 mt-2 mb-6">Connect your wallet to continue</p>
            <Button variant="cosmic" onClick={() => connect()}>
              <Wallet className="h-4 w-4 mr-2" /> Connect
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasDigitalID) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
            Create Your Digital ID
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Register your identity on-chain to participate in the Sarakt Universe
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {["personal", "corporate", "organization"].map((type) => {
              const Icon = type === "personal" ? User : type === "corporate" ? Building2 : Users;
              const active = idType === type;
              return (
                <div
                  key={type}
                  onClick={() => setIdType(type as any)}
                  className={`relative w-full h-[300px] border border-solid rounded-2xl overflow-hidden cursor-pointer transition-all ${
                    active ? "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.6)]" : "border-white/20 hover:border-purple-300/60"
                  }`}
                >
                  <div className="absolute inset-0 p-1 bg-purple-400">
                    <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-[#111]" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center backdrop-blur-lg rounded-2xl">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-orange-300 flex items-center justify-center mb-4">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold capitalize text-white mb-2">{type}</h3>
                    <p className="text-sm text-gray-400">
                      {type === "personal"
                        ? "Individual citizen identity"
                        : type === "corporate"
                        ? "Business entity registration"
                        : "Group or collective identity"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {idType && (
            <div className="mt-12 max-w-lg mx-auto">
              <div className="relative w-full h-auto border border-solid border-white/40 rounded-2xl overflow-hidden p-8 backdrop-blur-xl bg-[#111]/70">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">Setup Your {idType} ID</h2>
                <div className="space-y-4 text-left">
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
                  <Button
                    variant="cosmic"
                    size="lg"
                    className="w-full mt-8"
                    onClick={handleCreateID}
                    disabled={registering || !username || !email}
                  >
                    {registering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registering...
                      </>
                    ) : (
                      "Register Digital ID"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
            Digital ID Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            ID Active
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="relative w-full h-[350px] border border-solid border-white/40 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 p-1 bg-purple-400">
              <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-[#111]" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center backdrop-blur-lg rounded-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-orange-300 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-1 text-white">{digitalID?.username || "Unknown"}</h2>
              <p className="text-xs text-gray-400 mb-3">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
              <span className="text-xs text-muted-foreground">
                Registered: {digitalID?.registeredAt ? new Date(Number(digitalID.registeredAt) * 1000).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          {/* Assets Overview */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            {[
              { title: "AVAX Balance", value: parseFloat(balance).toFixed(4), color: "text-purple-400" },
              { title: "Land Plots", value: userPlots.length, color: "text-orange-400" },
              { title: "Status", value: "Active", color: "text-green-400" },
            ].map((item, i) => (
              <div key={i} className="relative w-full h-[180px] border border-solid border-white/40 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 p-1 bg-purple-400">
                  <div className="w-full h-full rounded-xl rounded-tr-[80px] rounded-br-[30px] bg-[#111]" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center backdrop-blur-lg rounded-2xl">
                  <p className="text-sm text-gray-400">{item.title}</p>
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Land Ownership */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-400" /> Land Ownership ({userPlots.length})
          </h3>
          {plotsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : userPlots.length ? (
            <div className="grid md:grid-cols-3 gap-6">
              {userPlots.map((plotId) => (
                <div key={plotId} className="relative h-[180px] border border-solid border-white/40 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 p-1 bg-purple-400">
                    <div className="w-full h-full rounded-xl rounded-tr-[80px] rounded-br-[30px] bg-[#111]" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center backdrop-blur-lg rounded-2xl">
                    <p className="text-lg font-bold text-white mb-1">SP-{String(plotId).padStart(4, "0")}</p>
                    <p className="text-sm text-gray-400 mb-1">Sarakt Prime - District {((plotId - 1) % 10) + 1}</p>
                    <p className="text-orange-400 font-semibold">Plot #{plotId}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No plots owned yet. Visit the Marketplace.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalID;
