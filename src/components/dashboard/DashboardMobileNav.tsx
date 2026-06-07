import {
  BarChart3,
  Send,
  Globe,
  Coins,
  MapPin,
} from "lucide-react";
import { useDashboardSidebar } from "@/contexts/DashboardSidebarContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type DashboardSection =
  | "asset-management"
  | "transfers"
  | "market-primary"
  | "market-speculative"
  | "hnwi-purchases";

interface DashboardMobileNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  phase1Only: boolean;
  onNavigateUniverse: () => void;
  onNavigateDeposit: () => void;
  onNavigatePlotPurchase: () => void;
}

export function DashboardMobileNav({
  activeSection,
  onSectionChange,
  phase1Only,
  onNavigateUniverse,
  onNavigateDeposit,
  onNavigatePlotPurchase,
}: DashboardMobileNavProps) {
  const { isOpen, setIsOpen } = useDashboardSidebar();

  const closeAnd = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const sectionButtonClass = (isActive: boolean) =>
    cn(
      "group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden",
      isActive
        ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02] border border-primary/50"
        : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground",
    );

  const routeButtonClass =
    "group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-[1.02] text-muted-foreground relative overflow-hidden";

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-72 p-0 border-r border-white/[0.06] bg-background/95 backdrop-blur-xl">
          <SheetHeader className="px-4 pt-6 pb-2 text-left">
            <SheetTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboard
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-2 px-4 pb-6">
            <div className="mb-2 pb-2 border-b border-primary/10 space-y-1">
              <button
                type="button"
                onClick={() => closeAnd(() => onSectionChange("asset-management"))}
                className={sectionButtonClass(activeSection === "asset-management")}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>Asset Management</span>
              </button>
              <button
                type="button"
                onClick={() => closeAnd(() => onSectionChange("transfers"))}
                className={sectionButtonClass(activeSection === "transfers")}
              >
                <Send className="h-4 w-4 shrink-0" />
                <span>Transfers</span>
              </button>
            </div>

            <div className="mb-2 pb-2 border-b border-primary/10 space-y-1">
              <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Explore
              </p>
              <button
                type="button"
                onClick={() => closeAnd(onNavigateUniverse)}
                className={routeButtonClass}
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>Universe</span>
              </button>
              <button
                type="button"
                onClick={() => closeAnd(onNavigateDeposit)}
                className={routeButtonClass}
              >
                <Coins className="h-4 w-4 shrink-0" />
                <span>Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => closeAnd(onNavigatePlotPurchase)}
                className={routeButtonClass}
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Plot Purchase</span>
              </button>
            </div>

            {!phase1Only && (
              <>
                <div className="mb-2 pb-2 border-b border-primary/10 space-y-1">
                  <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Market
                  </p>
                  <button
                    type="button"
                    onClick={() => closeAnd(() => onSectionChange("market-primary"))}
                    className={sectionButtonClass(activeSection === "market-primary")}
                  >
                    <span>Primary</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => closeAnd(() => onSectionChange("market-speculative"))}
                    className={sectionButtonClass(activeSection === "market-speculative")}
                  >
                    <span>Speculative</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => closeAnd(() => onSectionChange("hnwi-purchases"))}
                  className={sectionButtonClass(activeSection === "hnwi-purchases")}
                >
                  <span>Premium Assets</span>
                </button>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
