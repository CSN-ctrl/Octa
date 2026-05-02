import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Info, Search, UserPlus, Users } from "lucide-react";
import type { UserData } from "../types";

type UserFilter = "all" | "admin" | "with-wallet" | "no-wallet";
type UserSort = "newest" | "balance" | "plots";

type AdminTreasuryUsersPanelProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  userFilter: UserFilter;
  onUserFilterChange: (value: UserFilter) => void;
  userSort: UserSort;
  onUserSortChange: (value: UserSort) => void;
  users: UserData[];
  filteredUsers: UserData[];
  userEmails: Map<string, string>;
  onPromoteAffiliate: (user: UserData) => Promise<void> | void;
  onOpenTransfer: (identifier: string) => void;
  onOpenUserInfo: (user: UserData) => Promise<void> | void;
};

export function AdminTreasuryUsersPanel({
  searchQuery,
  onSearchQueryChange,
  userFilter,
  onUserFilterChange,
  userSort,
  onUserSortChange,
  users,
  filteredUsers,
  userEmails,
  onPromoteAffiliate,
  onOpenTransfer,
  onOpenUserInfo,
}: AdminTreasuryUsersPanelProps) {
  return (
    <Card className="order-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Full user info, account actions, transfers, and documents directly from each card.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <Button size="sm" variant={userFilter === "all" ? "default" : "outline"} onClick={() => onUserFilterChange("all")}>
              All
            </Button>
            <Button size="sm" variant={userFilter === "admin" ? "default" : "outline"} onClick={() => onUserFilterChange("admin")}>
              Admin
            </Button>
            <Button
              size="sm"
              variant={userFilter === "with-wallet" ? "default" : "outline"}
              onClick={() => onUserFilterChange("with-wallet")}
            >
              With wallet
            </Button>
            <Button
              size="sm"
              variant={userFilter === "no-wallet" ? "default" : "outline"}
              onClick={() => onUserFilterChange("no-wallet")}
            >
              No wallet
            </Button>
          </div>
          <Select value={userSort} onValueChange={(v) => onUserSortChange(v as UserSort)}>
            <SelectTrigger className="w-[170px] h-8">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Value</SelectItem>
              <SelectItem value="balance">Sort: Balance</SelectItem>
              <SelectItem value="plots">Sort: Plots</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-muted-foreground mb-2">{users.length === 0 ? "No users loaded" : "No users match search"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredUsers.map((user) => {
              const identifier = (user.wallet_address || user.email || `user_${user.email?.split("@")[0] || "unknown"}`).toLowerCase();
              const displayName = user.name || userEmails.get(user.wallet_address?.toLowerCase() || "") || user.email;
              const normalizedDisplayName = (displayName || "").trim().toLowerCase();
              const normalizedEmail = (user.email || "").trim().toLowerCase();
              const normalizedWallet = (user.wallet_address || "").trim().toLowerCase();
              const showEmailLine = Boolean(user.email) && normalizedDisplayName !== normalizedEmail;
              const allWallets = (user.wallets || []).filter(Boolean);
              const hasWallets = allWallets.length > 0;
              const normalizedAuthWallet = (user.auth_wallet_address || "").trim().toLowerCase();
              const walletAlreadyInList = allWallets.some((w) => w.toLowerCase() === normalizedWallet);
              const showWalletLine =
                Boolean(user.wallet_address) && normalizedWallet !== normalizedDisplayName && normalizedWallet !== normalizedEmail && !walletAlreadyInList;

              return (
                <Card key={identifier} className="glass-enhanced border-primary/20 shadow-glow-card">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-base">{displayName}</p>
                        {showEmailLine && <p className="text-xs text-muted-foreground break-all">{user.email}</p>}
                        {showWalletLine && <p className="font-mono text-xs text-muted-foreground break-all mt-1">{user.wallet_address}</p>}
                        {hasWallets ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Wallets ({allWallets.length})</p>
                            {allWallets.map((w) => {
                              const isAuthWallet = Boolean(normalizedAuthWallet) && w.toLowerCase() === normalizedAuthWallet;
                              return (
                                <p
                                  key={`${identifier}-${w}`}
                                  className="font-mono text-[11px] text-muted-foreground break-all flex flex-wrap items-center gap-1.5"
                                >
                                  <span>{w}</span>
                                  {isAuthWallet && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                                      Auth
                                    </Badge>
                                  )}
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          !user.wallet_address &&
                          !user.auth_wallet_address?.trim() && (
                            <p className="font-mono text-xs text-muted-foreground break-all mt-1">No wallet</p>
                          )
                        )}
                      </div>
                      <Badge variant="outline">{user.portfolios} portfolios</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-primary/10 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">xBGL</p>
                        <p className="font-semibold">{(user.balance?.xbgl_balance ?? 0).toFixed(2)}</p>
                      </div>
                      <div className="rounded-md border border-primary/10 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">Total Value</p>
                        <p className="font-semibold">{user.totalValue.toLocaleString()} xBGL</p>
                      </div>
                      <div className="rounded-md border border-primary/10 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">AVAX</p>
                        <p className="font-semibold">{(user.balance?.avax_balance ?? 0).toFixed(4)}</p>
                      </div>
                      <div className="rounded-md border border-primary/10 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">Assets</p>
                        <p className="font-semibold">{user.plots} plots</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void onPromoteAffiliate(user);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Affiliate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenTransfer(identifier);
                        }}
                      >
                        <Coins className="h-4 w-4 mr-1" />
                        Transfer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          void onOpenUserInfo(user);
                        }}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
