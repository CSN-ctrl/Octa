import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Coins,
  TrendingUp,
  Globe,
  MapPin,
  Briefcase,
  Hammer,
  Crown,
  Rocket,
  Zap,
  Network,
  ChevronRight,
  ChevronDown,
  FileText,
  BookOpen,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  subsections?: { id: string; title: string; path: string }[];
}

const docSections: DocSection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    path: "/docs",
  },
  {
    id: "paths",
    title: "Participation Paths",
    icon: MapPin,
    path: "/docs/paths",
    subsections: [
      { id: "landowner", title: "Path 1: Landowner", path: "/docs/paths/landowner" },
      { id: "worker", title: "Path 2: Worker/Expat", path: "/docs/paths/worker" },
    ],
  },
  {
    id: "income",
    title: "Income Methods",
    icon: Coins,
    path: "/docs/income",
    subsections: [
      { id: "rental", title: "Rental Income", path: "/docs/income/rental" },
      { id: "wages", title: "Wages", path: "/docs/income/wages" },
      { id: "business", title: "Business Profits", path: "/docs/income/business" },
      { id: "supporting", title: "Supporting Roles", path: "/docs/income/supporting" },
    ],
  },
  {
    id: "structures",
    title: "Building Structures",
    icon: Hammer,
    path: "/docs/structures",
  },
  {
    id: "jobs",
    title: "Job System",
    icon: Briefcase,
    path: "/docs/jobs",
  },
  {
    id: "sovereignty",
    title: "Sovereignty",
    icon: Crown,
    path: "/docs/sovereignty",
    subsections: [
      { id: "city", title: "City Ownership", path: "/docs/sovereignty/city" },
      { id: "planet", title: "Planet Ownership", path: "/docs/sovereignty/planet" },
      { id: "star-system", title: "Star System Ownership", path: "/docs/sovereignty/star-system" },
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    path: "/docs/getting-started",
  },
  {
    id: "economy",
    title: "Economic Ecosystem",
    icon: TrendingUp,
    path: "/docs/economy",
  },
  {
    id: "phases",
    title: "Phase Progression",
    icon: Zap,
    path: "/docs/phases",
  },
  {
    id: "features",
    title: "Key Features",
    icon: Network,
    path: "/docs/features",
  },
];

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["paths", "income", "sovereignty"])
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (section: DocSection) => {
    if (isActive(section.path)) return true;
    if (section.subsections) {
      return section.subsections.some((sub) => isActive(sub.path));
    }
    return false;
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* Sidebar Navigation - Directory Style */}
        <aside
          className={cn(
            "shrink-0 border-r border-primary/30 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden border-r-0"
          )}
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Documentation</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-primary/10"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1">
              {docSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center">
                    {section.subsections ? (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-1 hover:bg-primary/10 rounded"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="w-6" />
                    )}
                    <Link
                      to={section.path}
                      className={cn(
                        "flex-1 flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-lg transition-colors",
                        isParentActive(section)
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </Link>
                  </div>
                  {section.subsections && expandedSections.has(section.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <Link
                          key={subsection.id}
                          to={subsection.path}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors",
                            isActive(subsection.path)
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary/30" />
                          <span>{subsection.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {!sidebarOpen && (
            <div className="fixed top-24 left-4 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="bg-background/95 backdrop-blur-xl border-primary/30 shadow-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="px-6 py-8 pb-16 max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {description && (
                <p className="text-lg text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DocsLayout;
