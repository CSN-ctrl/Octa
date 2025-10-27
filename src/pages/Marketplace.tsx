import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import ContractABI from "@/abi/YourContractABI.json";
import { connectWallet, getContract } from "@/lib/wallet";
import { uploadDeedToPinata, uploadPDFToPinata } from "@/lib/pinata";
import { generateDeedPDF } from "@/lib/deedPdf";

interface Listing {
  id: number;
  plotId: string;
  location: string;
  owner: string;
  price: number;
  priceChange: string;
  jsonCID?: string;
  pdfCID?: string;
}

const initialListings: Listing[] = [
  { id: 1, plotId: "SP-0042", location: "Sarakt Prime - District A", owner: "0x1234...5678", price: 75, priceChange: "+12%" },
  { id: 2, plotId: "SP-0156", location: "Sarakt Prime - District B", owner: "0x9876...4321", price: 68, priceChange: "+8%" },
  { id: 3, plotId: "SP-0891", location: "Sarakt Prime - District C", owner: "0xabcd...ef01", price: 82, priceChange: "+15%" },
  { id: 4, plotId: "ZY-0023", location: "Zythera Station - Module 1", owner: "0x2345...6789", price: 95, priceChange: "+20%" },
  { id: 5, plotId: "NX-0334", location: "Nexus Hub - Central District", owner: "0x3456...7890", price: 120, priceChange: "+25%" },
  { id: 6, plotId: "SP-0523", location: "Sarakt Prime - District D", owner: "0x4567...8901", price: 65, priceChange: "+5%" },
];

export default function Marketplace() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleConnectWallet = async () => {
    try {
      const { signer, address } = await connectWallet();
      setWalletAddress(address);
      setSigner(signer);
      setContract(getContract(signer, ContractABI, import.meta.env.VITE_CONTRACT_ADDRESS));
      toast.success(`Wallet connected: ${address}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect wallet");
    }
  };

  const handlePurchase = async (listing: Listing) => {
    if (!signer || !contract || !walletAddress) return toast.error("Connect wallet first");

    setLoadingId(listing.id);

    try {
      const deedJson = {
        plotId: listing.plotId,
        owner: walletAddress,
        location: listing.location,
        price: listing.price,
        date: new Date().toLocaleDateString(),
      };

      const jsonCID = await uploadDeedToPinata(deedJson);
      const pdfBytes = await generateDeedPDF("/deed-template.pdf", { ...deedJson, ipfs: `ipfs://${jsonCID}` });
      const pdfCID = await uploadPDFToPinata(pdfBytes, `${listing.plotId}-deed.pdf`);

      // Auto-download PDF
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${listing.plotId}-deed.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      const tx = await contract.buyPlot(listing.plotId, jsonCID, pdfCID, {
        value: ethers.parseUnits(listing.price.toString(), "ether"),
      });
      await tx.wait();

      toast.success(`Purchased ${listing.plotId}! Deed pinned on IPFS.`, {
        description: `JSON: ipfs://${jsonCID}\nPDF: ipfs://${pdfCID}`,
      });

      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, owner: walletAddress, jsonCID, pdfCID } : l
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Purchase failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-end mb-4">
          <Button variant="cosmic" onClick={handleConnectWallet}>
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </Button>
        </div>

        <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
          Land Marketplace
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Browse and purchase land plots from other citizens
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Listings</p>
                <p className="text-3xl font-bold">{listings.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Price</p>
                <p className="text-3xl font-bold">82 xBGL</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Traders</p>
                <p className="text-3xl font-bold">1,247</p>
              </div>
              <User className="h-8 w-8 text-secondary" />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="glass border-primary/30 hover:border-primary transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{listing.plotId}</h3>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                  </div>
                  <div className="glass px-2 py-1 rounded text-xs font-medium text-accent">
                    {listing.priceChange}
                  </div>
                </div>

                <div className="glass p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Owner</span>
                  </div>
                  <p className="text-sm font-mono">{listing.owner}</p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold text-primary">
                    {listing.price} xBGL
                  </span>
                </div>

                <Button
                  variant="cosmic"
                  className="w-full mb-2"
                  onClick={() => handlePurchase(listing)}
                  disabled={loadingId === listing.id}
                >
                  {loadingId === listing.id ? "Processing..." : "Purchase Plot"}
                </Button>

                {listing.jsonCID && listing.pdfCID && (
                  <div className="text-sm text-muted-foreground mt-2 flex flex-col gap-1">
                    <a
                      href={`https://ipfs.io/ipfs/${listing.jsonCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      JSON Deed <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={`https://ipfs.io/ipfs/${listing.pdfCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      PDF Deed <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
