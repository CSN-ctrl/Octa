/**
 * ChaosStar Connection Status Component
 * Shows the connection status to the ChaosStar backend
 */

import { useContext } from "react";
import { ChaosStarContext } from "@/contexts/ChaosStarContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export function ChaosStarStatus() {
  // Use useContext directly to avoid throwing error if provider not available
  const contextValue = useContext(ChaosStarContext);
  
  // If context is not available, return null (component will not render)
  if (contextValue === undefined) {
    return null;
  }
  
  const { isConnected, isLoading, error, health, refresh, reconnect } = contextValue;

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </Badge>
    );
  }

  if (!isConnected) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex">
            <Badge variant="destructive" className="gap-1 cursor-pointer hover:bg-destructive/80">
              <XCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span>
            </Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <h4 className="font-semibold">Backend Disconnected</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {error || "Cannot connect to ChaosStar backend. Some features may not work."}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Start the backend with:</p>
              <code className="block bg-muted px-2 py-1 rounded text-xs">
                chaosstar octavia start
              </code>
            </div>
            <Button size="sm" onClick={reconnect} className="w-full gap-2">
              <RefreshCw className="h-3 w-3" />
              Retry Connection
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Connected
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex">
          <Badge 
            variant="outline" 
            className="gap-1 cursor-pointer hover:bg-accent border-green-500/50 text-green-600"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span className="hidden sm:inline">ChaosStar</span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">ChaosStar Connected</h4>
            </div>
            <Button size="sm" variant="ghost" onClick={refresh} className="h-7 w-7 p-0">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          {health && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono">{health.chain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain ID</span>
                <span className="font-mono">{health.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="font-mono text-xs">
                      {health.blockchainId.slice(0, 8)}...
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-mono text-xs">{health.blockchainId}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  {health.contractConnected ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="text-xs">
                    VM: {health.contractConnected ? "Connected" : "Mock Mode"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {health.stargateConnected ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs">
                    Stargate: {health.stargateConnected ? "Running" : "Not Running"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ChaosStarStatus;


