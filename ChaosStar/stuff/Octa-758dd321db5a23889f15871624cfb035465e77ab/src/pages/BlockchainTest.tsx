import { BlockchainSimulator } from "@/components/BlockchainSimulator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function BlockchainTest() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Blockchain Simulator Test</h1>
        <p className="text-muted-foreground">
          Test the Supabase blockchain simulation system. This simulates blockchain operations
          including transfers, minting, and burning of tokens (xBGL, CHAOS, AVAX, SC).
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This is a simulation running on Supabase. All transactions are
          stored in the database and can be migrated to the real blockchain later. Connect your
          wallet to start testing.
        </AlertDescription>
      </Alert>

      <BlockchainSimulator />

      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding the blockchain simulation system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Transfer Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Transfer tokens between addresses. The system checks for sufficient balance
              and performs atomic operations (all or nothing).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Mint Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Create new tokens and add them to any address. Useful for testing and
              initial token distribution.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Burn Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Remove tokens from your address. This reduces the total supply and
              creates a burn transaction record.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">
              All balance changes are reflected in real-time using Supabase subscriptions.
              Transactions are immediately recorded in the database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

