import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Crown,
  Globe,
  HelpCircle,
  Rocket,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type DashboardSection =
  | "asset-management"
  | "transfers"
  | "market-primary"
  | "market-speculative"
  | "hnwi-purchases";

interface DashboardSidebarNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  phase1Only: boolean;
  onLoadHNWIAssets?: () => void;
}

const activeButtonClass =
  "bg-gradient-cosmic text-primary-foreground shadow-glow-primary border border-primary/50 font-medium";

const exploreHighlightClass =
  "bg-gradient-cosmic/20 text-primary border border-primary/30 shadow-lg hover:bg-gradient-cosmic hover:text-primary-foreground";

export function DashboardSidebarNav({
  activeSection,
  onSectionChange,
  phase1Only,
  onLoadHNWIAssets,
}: DashboardSidebarNavProps) {
  const navigate = useNavigate();

  const sectionButtonClass = (isActive: boolean) =>
    cn(isActive && activeButtonClass);

  return (
    <SidebarContent className="bg-background/80 backdrop-blur-xl pt-4">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2 uppercase tracking-wider">
          <BarChart3 className="h-4 w-4 text-primary" />
          Dashboard
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "asset-management"}
                className={sectionButtonClass(activeSection === "asset-management")}
                onClick={() => onSectionChange("asset-management")}
              >
                <BarChart3 />
                <span>Asset Management</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "transfers"}
                className={sectionButtonClass(activeSection === "transfers")}
                onClick={() => onSectionChange("transfers")}
              >
                <Send />
                <span>Transfers</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {!phase1Only && (
        <>
          <SidebarSeparator className="bg-primary/10" />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 uppercase tracking-wider">
              <Globe className="h-4 w-4 text-primary" />
              Explore
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={exploreHighlightClass}
                    onClick={() => navigate("/ilo")}
                  >
                    <Rocket />
                    <span className="font-semibold">ILO</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/lore")}>
                    <BookOpen />
                    <span>Lore</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/how-it-works")}>
                    <HelpCircle />
                    <span>How It Works</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/business")}>
                    <Briefcase />
                    <span>Business</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-primary/10" />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-primary" />
              Market
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === "market-primary"}
                    className={sectionButtonClass(activeSection === "market-primary")}
                    onClick={() => onSectionChange("market-primary")}
                  >
                    <Sparkles />
                    <span>Primary</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === "market-speculative"}
                    className={sectionButtonClass(activeSection === "market-speculative")}
                    onClick={() => onSectionChange("market-speculative")}
                  >
                    <Zap />
                    <span>Speculative</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-primary/10" />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 uppercase tracking-wider">
              <Crown className="h-4 w-4 text-primary" />
              Celestial Assets
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === "hnwi-purchases"}
                    className={sectionButtonClass(activeSection === "hnwi-purchases")}
                    aria-label="Premium Assets section"
                    aria-pressed={activeSection === "hnwi-purchases"}
                    onClick={() => {
                      onSectionChange("hnwi-purchases");
                      onLoadHNWIAssets?.();
                    }}
                  >
                    <Crown aria-hidden="true" />
                    <span>Premium Assets</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
    </SidebarContent>
  );
}
