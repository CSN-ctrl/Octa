import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBlockchain, TokenType } from "@/hooks/useBlockchain";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Send, Coins, Flame, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function BlockchainSimulator() {
  const { address, isConnected } = useWallet();
  const {
    transfer,
    mint,
    burn,
    getBalance,
    getAllBalances,
    getTotalSupply,
    loading,
  } = useBlockchain();

  const [balances, setBalances] = useState({
    xBGL: 0,
    CHAOS: 0,
    AVAX: 0,
    SC: 0,
  });
  const [totalSupply, setTotalSupply] = useState({
    xBGL: 0,
    CHAOS: 0,
    AVAX: 0,
    SC: 0,
  });

  const [transferForm, setTransferForm] = useState({
    toAddress: "",
    amount: "",
    tokenType: "xBGL" as TokenType,
  });

  const [mintForm, setMintForm] = useState({
    toAddress: "",
    amount: "",
    tokenType: "xBGL" as TokenType,
  });

  const [burnForm, setBurnForm] = useState({
    amount: "",
    tokenType: "xBGL" as TokenType,
  });

  const loadBalances = async () => {
    if (!address) return;

    try {
      const allBalances = await getAllBalances();
      setBalances({
        xBGL: allBalances.xBGL,
        CHAOS: allBalances.CHAOS,
        AVAX: allBalances.AVAX,
        SC: allBalances.SC,
      });
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  const loadTotalSupply = async () => {
    try {
      const supplies = await Promise.all([
        getTotalSupply("xBGL"),
        getTotalSupply("CHAOS"),
        getTotalSupply("AVAX"),
        getTotalSupply("SC"),
      ]);

      setTotalSupply({
        xBGL: supplies[0],
        CHAOS: supplies[1],
        AVAX: supplies[2],
        SC: supplies[3],
      });
    } catch (error) {
      console.error("Error loading total supply:", error);
    }
  };

  useEffect(() => {
    if (address) {
      loadBalances();
      loadTotalSupply();
    }
  }, [address]);

  const handleTransfer = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!transferForm.toAddress || !transferForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await transfer(
        transferForm.toAddress,
        parseFloat(transferForm.amount),
        transferForm.tokenType
      );
      setTransferForm({ toAddress: "", amount: "", tokenType: "xBGL" });
      await loadBalances();
      await loadTotalSupply();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleMint = async () => {
    if (!mintForm.toAddress || !mintForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await mint(
        mintForm.toAddress,
        parseFloat(mintForm.amount),
        mintForm.tokenType
      );
      setMintForm({ toAddress: "", amount: "", tokenType: "xBGL" });
      await loadBalances();
      await loadTotalSupply();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleBurn = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!burnForm.amount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await burn(
        address,
        parseFloat(burnForm.amount),
        burnForm.tokenType
      );
      setBurnForm({ amount: "", tokenType: "xBGL" });
      await loadBalances();
      await loadTotalSupply();
    } catch (error) {
      // Error already handled in hook
    }
  };

  if (!isConnected) {
    return (
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Blockchain Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please connect your wallet to use the blockchain simulator</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your Balances
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadBalances} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">xBGL</div>
              <div className="text-2xl font-bold">{balances.xBGL.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">CHAOS</div>
              <div className="text-2xl font-bold">{balances.CHAOS.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">AVAX</div>
              <div className="text-2xl font-bold">{balances.AVAX.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">SC</div>
              <div className="text-2xl font-bold">{balances.SC.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Supply */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Total Supply
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">xBGL</div>
              <div className="text-xl font-bold">{totalSupply.xBGL.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">CHAOS</div>
              <div className="text-xl font-bold">{totalSupply.CHAOS.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">AVAX</div>
              <div className="text-xl font-bold">{totalSupply.AVAX.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 glass-enhanced rounded-lg">
              <div className="text-sm text-muted-foreground">SC</div>
              <div className="text-xl font-bold">{totalSupply.SC.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Token Type</Label>
            <Select
              value={transferForm.tokenType}
              onValueChange={(value) => setTransferForm({ ...transferForm, tokenType: value as TokenType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xBGL">xBGL</SelectItem>
                <SelectItem value="CHAOS">CHAOS</SelectItem>
                <SelectItem value="AVAX">AVAX</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Address</Label>
            <Input
              placeholder="0x..."
              value={transferForm.toAddress}
              onChange={(e) => setTransferForm({ ...transferForm, toAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
            />
          </div>
          <Button onClick={handleTransfer} disabled={loading} className="w-full">
            Transfer
          </Button>
        </CardContent>
      </Card>

      {/* Mint */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Mint Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Token Type</Label>
            <Select
              value={mintForm.tokenType}
              onValueChange={(value) => setMintForm({ ...mintForm, tokenType: value as TokenType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xBGL">xBGL</SelectItem>
                <SelectItem value="CHAOS">CHAOS</SelectItem>
                <SelectItem value="AVAX">AVAX</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Address</Label>
            <Input
              placeholder="0x..."
              value={mintForm.toAddress}
              onChange={(e) => setMintForm({ ...mintForm, toAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={mintForm.amount}
              onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
            />
          </div>
          <Button onClick={handleMint} disabled={loading} className="w-full">
            Mint
          </Button>
        </CardContent>
      </Card>

      {/* Burn */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Burn Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Token Type</Label>
            <Select
              value={burnForm.tokenType}
              onValueChange={(value) => setBurnForm({ ...burnForm, tokenType: value as TokenType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xBGL">xBGL</SelectItem>
                <SelectItem value="CHAOS">CHAOS</SelectItem>
                <SelectItem value="AVAX">AVAX</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={burnForm.amount}
              onChange={(e) => setBurnForm({ ...burnForm, amount: e.target.value })}
            />
          </div>
          <Button onClick={handleBurn} disabled={loading} className="w-full">
            Burn
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

