/**
 * Keys Manager Component
 * Manages Avalanche CLI keys and their balances
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  KeyRound, 
  RefreshCw, 
  Copy, 
  Check,
  Wallet,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/api";

interface KeyInfo {
  name: string;
  address: string;
  balance: string;
  cBalance?: string;
  pBalance?: string;
  xBalance?: string;
}

interface KeysManagerProps {
  onKeySelect?: (keyName: string, address: string) => void;
}

export function KeysManager({ onKeySelect }: KeysManagerProps) {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null);
  const [privateKeys, setPrivateKeys] = useState<Record<string, string>>({});

  const loadKeys = useCallback(async () => {
    // CLI integration removed - not needed at the moment
    setLoading(true);
    try {
      setKeys([]);
    } catch (error: any) {
      console.error("Failed to load keys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success("Address copied!");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const loadPrivateKey = async (keyName: string) => {
    // CLI integration removed - not needed at the moment
    toast.error("CLI integration removed - private keys not available");
  };

  return (
    <Card className="glass-enhanced border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">ChaosStar Keys</CardTitle>
              <CardDescription>CLI-managed wallet keys</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={loadKeys} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No Avalanche CLI keys found</p>
            <p className="text-sm">Create keys with: avalanche key create</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {keys.map((key) => (
                <div 
                  key={key.name}
                  className="p-4 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {key.name}
                      </Badge>
                      {onKeySelect && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onKeySelect(key.name, key.address)}
                        >
                          <Wallet className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      )}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {parseFloat(key.balance).toFixed(4)} xBGL
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">C-Chain:</span>
                      <code className="text-xs bg-background/50 px-2 py-1 rounded flex-1 truncate">
                        {key.address}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyAddress(key.address)}
                      >
                        {copiedAddress === key.address ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    {key.pBalance && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">P-Chain:</span>
                        <span className="text-xs">{key.pBalance} AVAX</span>
                      </div>
                    )}
                    
                    {key.xBalance && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">X-Chain:</span>
                        <span className="text-xs">{key.xBalance} AVAX</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => loadPrivateKey(key.name)}
                      >
                        {showPrivateKey === key.name ? (
                          <EyeOff className="h-3 w-3 mr-1" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        {showPrivateKey === key.name ? "Hide" : "Show"} Key
                      </Button>
                    </div>
                    
                    {showPrivateKey === key.name && privateKeys[key.name] && (
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-xs text-red-500 mb-1">⚠️ Never share your private key!</p>
                        <code className="text-xs break-all">
                          {privateKeys[key.name]}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

