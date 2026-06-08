import { useEffect, useState, type ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  sidebarNav: ReactNode;
  mobileNav: ReactNode;
}

function useIsLgDesktop() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mq.matches);
    mq.addEventListener("change", onChange);
    setIsLg(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isLg;
}

export function DashboardLayout({
  children,
  sidebarOpen,
  onSidebarOpenChange,
  sidebarNav,
  mobileNav,
}: DashboardLayoutProps) {
  const isLgDesktop = useIsLgDesktop();

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <div className="flex min-h-[calc(100vh-5rem)] items-stretch">
        {isLgDesktop && (
          <Sidebar
            collapsible="offcanvas"
            className={cn(
              "border-r border-white/[0.06] bg-background/80 backdrop-blur-xl",
              !sidebarOpen && "border-r-0",
            )}
          >
            {sidebarNav}
          </Sidebar>
        )}

        {mobileNav}

        <SidebarInset className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
