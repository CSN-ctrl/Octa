import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Wallet } from "lucide-react";
import type { AdminTab } from "../types";

type AdminSidebarProps = {
  isSidebarOpen: boolean;
  activeTab: AdminTab;
  usersCount: number;
  onSelectTab: (tab: AdminTab) => void;
  onOpenAffiliates: () => void;
};

export function AdminSidebar({
  isSidebarOpen,
  activeTab,
  usersCount,
  onSelectTab,
  onOpenAffiliates,
}: AdminSidebarProps) {
  return (
    <div
      className={`
        fixed top-0 left-0 h-screen z-40 w-[280px]
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
      `}
    >
      <Card className="h-full overflow-hidden rounded-none border-r border-primary/15 bg-gradient-to-b from-card via-card/95 to-card/90 shadow-lg shadow-primary/10 pt-20">
        <CardContent className="p-0 h-[calc(100vh-5rem)]">
          <nav className="space-y-2 p-3">
            <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90">Core</p>
            <button
              onClick={() => onSelectTab("treasury")}
              className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "treasury"
                  ? "bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/20"
                  : "text-muted-foreground border border-transparent hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Treasury + Users</span>
              </span>
              <Badge
                variant="outline"
                className="h-5 min-w-5 px-1 text-[10px] border-primary/20 bg-background/40 text-muted-foreground"
              >
                {usersCount}
              </Badge>
            </button>
            <button
              onClick={() => onSelectTab("documents")}
              className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "documents"
                  ? "bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/20"
                  : "text-muted-foreground border border-transparent hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </span>
            </button>
            <div className="my-1 border-t border-primary/10" />
            <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90">Growth</p>
            <button
              onClick={onOpenAffiliates}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-transparent transition-all duration-200 hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Affiliates</span>
              </span>
            </button>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
