import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Shield, UserPlus } from "lucide-react";

type TransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: any;
  transferTo: string;
  transferAmount: string;
  transferring: boolean;
  onTransferToChange: (value: string) => void;
  onTransferAmountChange: (value: string) => void;
  onTransfer: () => void;
};

export function AdminTransferDialog(props: TransferDialogProps) {
  const {
    open,
    onOpenChange,
    selectedUser,
    transferTo,
    transferAmount,
    transferring,
    onTransferToChange,
    onTransferAmountChange,
    onTransfer,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer xBGL</DialogTitle>
          <DialogDescription>
            Transfer xBGL from {selectedUser?.email} to another wallet (Frontend Only - No Blockchain)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>From (Balance: {selectedUser?.balance?.xbgl_balance.toFixed(2)} xBGL)</Label>
            <Input value={selectedUser?.wallet_address || ""} disabled className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>To Wallet Address</Label>
            <Input
              placeholder="0x..."
              value={transferTo}
              onChange={(e) => onTransferToChange(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (xBGL)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => onTransferAmountChange(e.target.value)}
            />
          </div>
          <Button onClick={onTransfer} disabled={transferring || !transferAmount || !transferTo} className="w-full">
            {transferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Transfer xBGL
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TreasuryTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treasuryBalance: number;
  treasuryTransferTo: string;
  treasuryTransferAmount: string;
  transferringFromTreasury: boolean;
  loading: boolean;
  users: any[];
  onTreasuryTransferToChange: (value: string) => void;
  onTreasuryTransferAmountChange: (value: string) => void;
  onLoadUsers: () => void;
  onTransfer: () => void;
};

export function AdminTreasuryTransferDialog(props: TreasuryTransferDialogProps) {
  const {
    open,
    onOpenChange,
    treasuryBalance,
    treasuryTransferTo,
    treasuryTransferAmount,
    transferringFromTreasury,
    loading,
    users,
    onTreasuryTransferToChange,
    onTreasuryTransferAmountChange,
    onLoadUsers,
    onTransfer,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer from Treasury</DialogTitle>
          <DialogDescription>
            Transfer xBGL from treasury to a user account. Treasury Balance: {treasuryBalance.toLocaleString()} xBGL
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Authenticated User</Label>
            <Select
              value={treasuryTransferTo}
              onValueChange={onTreasuryTransferToChange}
              onOpenChange={(openState) => {
                if (openState && !loading) onLoadUsers();
              }}
            >
              <SelectTrigger className="font-mono">
                <SelectValue placeholder="Select an authenticated user" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {loading && users.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users-loaded" disabled>
                    <div className="flex flex-col py-1">
                      <span className="text-sm">No users loaded</span>
                      <span className="text-xs text-muted-foreground">Users will be loaded automatically</span>
                    </div>
                  </SelectItem>
                ) : (
                  users.map((user) => {
                    const identifier = (
                      user.wallet_address ||
                      user.email ||
                      `user_${user.email?.split("@")[0] || "unknown"}`
                    ).toLowerCase();

                    return (
                      <SelectItem key={identifier} value={identifier}>
                        <div className="flex flex-col py-1">
                          <span className="text-sm font-medium">{user.name || user.email}</span>
                          {user.wallet_address ? (
                            <span className="text-xs text-muted-foreground font-mono">{user.wallet_address}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No wallet registered</span>
                          )}
                          {user.name && user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All authenticated users can receive transfers. Funds will be available in their asset management page.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Amount (xBGL)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={treasuryTransferAmount}
              onChange={(e) => onTreasuryTransferAmountChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Available: {treasuryBalance.toLocaleString()} xBGL</p>
          </div>
          <Button onClick={onTransfer} disabled={transferringFromTreasury || !treasuryTransferTo || !treasuryTransferAmount} className="w-full">
            {transferringFromTreasury ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Transfer from Treasury
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TreasuryConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treasuryConfig: any;
  onTreasuryConfigChange: (next: any) => void;
  onSave: () => void;
};

export function AdminTreasuryConfigDialog({
  open,
  onOpenChange,
  treasuryConfig,
  onTreasuryConfigChange,
  onSave,
}: TreasuryConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-enhanced border-primary/20 shadow-glow-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Treasury Configuration
          </DialogTitle>
          <DialogDescription>
            Configure treasury transfer limits, approval requirements, and security settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Transfer Amount</Label>
              <Input
                type="number"
                value={treasuryConfig.minTransferAmount}
                onChange={(e) =>
                  onTreasuryConfigChange({
                    ...treasuryConfig,
                    minTransferAmount: parseFloat(e.target.value) || 1,
                  })
                }
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Transfer Amount</Label>
              <Input
                type="number"
                value={treasuryConfig.maxTransferAmount}
                onChange={(e) =>
                  onTreasuryConfigChange({
                    ...treasuryConfig,
                    maxTransferAmount: parseFloat(e.target.value) || 1000000,
                  })
                }
                placeholder="1000000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Daily Transfer Limit</Label>
            <Input
              type="number"
              value={treasuryConfig.dailyTransferLimit}
              onChange={(e) =>
                onTreasuryConfigChange({
                  ...treasuryConfig,
                  dailyTransferLimit: parseFloat(e.target.value) || 10000000,
                })
              }
              placeholder="10000000"
            />
          </div>
          <div className="space-y-2">
            <Label>Auto-Approve Threshold</Label>
            <Input
              type="number"
              value={treasuryConfig.autoApproveThreshold}
              onChange={(e) =>
                onTreasuryConfigChange({
                  ...treasuryConfig,
                  autoApproveThreshold: parseFloat(e.target.value) || 1000,
                })
              }
              placeholder="1000"
            />
            <p className="text-xs text-muted-foreground">Transfers below this amount will be auto-approved</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireApproval"
              checked={treasuryConfig.requireApproval}
              onChange={(e) =>
                onTreasuryConfigChange({
                  ...treasuryConfig,
                  requireApproval: e.target.checked,
                })
              }
              className="rounded border-primary"
            />
            <Label htmlFor="requireApproval" className="cursor-pointer">
              Require approval for all transfers
            </Label>
          </div>
          <div className="flex gap-2 pt-4 border-t border-primary/10">
            <Button className="flex-1" onClick={onSave}>
              Save Configuration
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AddTreasuryManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newManagerEmail: string;
  onNewManagerEmailChange: (value: string) => void;
  onAddManager: () => void;
};

export function AdminAddTreasuryManagerDialog({
  open,
  onOpenChange,
  newManagerEmail,
  onNewManagerEmailChange,
  onAddManager,
}: AddTreasuryManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-enhanced border-primary/20 shadow-glow-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Treasury Manager
          </DialogTitle>
          <DialogDescription>Grant treasury management access to a user by their email address</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>User Email</Label>
            <Input
              type="text"
              value={newManagerEmail}
              onChange={(e) => onNewManagerEmailChange(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" onClick={onAddManager} disabled={!newManagerEmail}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
