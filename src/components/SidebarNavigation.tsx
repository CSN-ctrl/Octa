import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Menu,
  Globe, 
  ChevronRight, 
  Folder, 
  FolderOpen,
  File,
  ShoppingCart,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DirectoryItem {
  type: "folder" | "file";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: DirectoryItem[];
}

export function SidebarNavigation() {
  const location = useLocation();
  const { address, isConnected } = useWallet();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const directoryStructure: DirectoryItem[] = [
    {
      type: "file",
      label: "Universe",
      icon: Globe,
      path: "/",
    },
    {
      type: "file",
      label: "Financial Hub",
      icon: ShoppingCart,
      path: "/financial-hub",
    },
  ];

  const renderDirectoryItem = (item: DirectoryItem, level: number = 0, isSubItem: boolean = false): React.ReactNode => {
    const isFolder = item.type === "folder";
    const folderPath = `folder-${item.label}`;
    const isExpanded = expandedFolders.has(folderPath);
    const hasActiveChild = item.children?.some(
      (child) => child.path === location.pathname || 
      (child.children && child.children.some(c => c.path === location.pathname))
    ) || false;
    const isActive = item.path === location.pathname;

    if (isFolder) {
      if (isSubItem) {
        // Nested folder - render as sub-item
        return (
          <div key={folderPath}>
            <button
              onClick={() => toggleFolder(folderPath)}
              className={cn(
                "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground w-full text-left",
                hasActiveChild && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 ml-auto shrink-0 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
            {isExpanded && item.children && (
              <SidebarMenuSub>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={`${folderPath}-${child.label}`}>
                    {renderDirectoryItem(child, level + 1, true)}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </div>
        );
      } else {
        // Top-level folder
        return (
          <SidebarMenuItem key={folderPath}>
            <SidebarMenuButton
              onClick={() => toggleFolder(folderPath)}
              isActive={hasActiveChild}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                <span>{item.label}</span>
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </SidebarMenuButton>
            {isExpanded && item.children && (
              <SidebarMenuSub>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={`${folderPath}-${child.label}`}>
                    {renderDirectoryItem(child, level + 1, true)}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      }
    } else {
      // File item
      const Icon = item.icon || File;
      if (isSubItem) {
        return (
          <SidebarMenuSubButton asChild isActive={isActive}>
            <Link to={item.path || "#"} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuSubButton>
        );
      } else {
        return (
          <SidebarMenuItem key={item.path || item.label}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
              <Link to={item.path || "#"} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }
    }
  };

  // Auto-expand folders that contain the active route
  useEffect(() => {
    const findAndExpand = (items: DirectoryItem[]): void => {
      items.forEach((item) => {
        if (item.type === "folder" && item.children) {
          const hasActive = item.children.some(
            (child) => child.path === location.pathname ||
            (child.children && child.children.some(c => c.path === location.pathname))
          );
          if (hasActive) {
            setExpandedFolders((prev) => new Set(prev).add(`folder-${item.label}`));
          }
          findAndExpand(item.children);
        }
      });
    };
    findAndExpand(directoryStructure);
  }, [location.pathname]);

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className="w-64">
      <SidebarContent className="px-2 pt-24">
        {/* Wallet Connection Status */}
        <SidebarGroup className="mb-4">
          <SidebarGroupContent>
            <div className="px-2 py-2">
              {isConnected ? (
                <Badge 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-green-500/50 bg-green-500/10 text-green-400"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs font-medium">Wallet Connected</span>
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-red-500/50 bg-red-500/10 text-red-400"
                >
                  <XCircle className="h-3 w-3" />
                  <span className="text-xs font-medium">Wallet Not Connected</span>
                </Badge>
              )}
              {isConnected && address && (
                <div className="mt-1 px-2 text-xs text-muted-foreground font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold">Directory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {directoryStructure.map((item) => renderDirectoryItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function SidebarToggle() {
  try {
    const { toggleSidebar } = useSidebar();
    
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={toggleSidebar}
        data-sidebar="trigger"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    );
  } catch (error) {
    console.error("SidebarToggle error:", error);
    // Fallback button if sidebar context is not available
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => console.warn("Sidebar not available")}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    );
  }
}

