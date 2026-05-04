/**
 * Structured Data Component
 * Adds JSON-LD structured data for SEO
 */
import { useEffect, useMemo } from "react";
import { getAppOrigin } from "@/lib/app-origin";
import { useLocation } from "react-router-dom";

interface StructuredDataProps {
  type?: "Organization" | "WebSite" | "WebPage" | "Product" | "BreadcrumbList" | "FAQPage" | "Article";
  data: Record<string, unknown>;
  id?: string;
}

export function StructuredData({ type = "WebSite", data, id }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id ?? `structured-data-${type.toLowerCase()}`;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    };
    
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById(script.id);
      if (existing) {
        existing.remove();
      }
    };
  }, [type, data, id]);

  return null;
}

/**
 * Default structured data for the site
 */
export function DefaultStructuredData() {
  const origin = getAppOrigin();
  
  return (
    <>
      <StructuredData
        type="Organization"
        id="structured-data-organization"
        data={{
          name: "Chaos Star Universe",
          url: origin,
          logo: `${origin}/chaos-star-logo.png`,
          description: "Explore star systems, claim land, build your digital identity, and become part of the cosmic economy in Chaos Star Universe",
          sameAs: [
            "https://x.com/OIG_CSN",
          ],
        }}
      />
      <StructuredData
        type="WebSite"
        id="structured-data-website"
        data={{
          name: "Chaos Star Universe",
          url: origin,
          description: "Explore star systems, claim land, build your digital identity, and become part of the cosmic economy in Chaos Star Universe",
        }}
      />
    </>
  );
}

type RouteSchemaConfig = {
  path: string;
  name: string;
  description: string;
  indexable: boolean;
  schemaType?: "WebPage" | "Article" | "FAQPage";
};

const ROUTE_SCHEMA_CONFIG: RouteSchemaConfig[] = [
  { path: "/", name: "Chaos Star Universe", description: "Explore star systems, claim land, build your digital identity, and participate in the Chaos Star economy.", indexable: true },
  { path: "/universe", name: "Unified Universe", description: "Navigate planets, cities, and systems in the interactive Chaos Star universe map.", indexable: true },
  { path: "/business", name: "Business", description: "Review business opportunities and governance mechanics in the Chaos Star universe.", indexable: true },
  { path: "/ilo", name: "Pioneers ILO", description: "Discover the Initial Land Offering and pioneer participation details.", indexable: true },
  { path: "/invest", name: "Invest", description: "Learn investment pathways and growth opportunities in Chaos Star.", indexable: true },
  { path: "/apply-expert", name: "Apply As Expert", description: "Apply to become a verified expert contributor in the Chaos Star ecosystem.", indexable: true },
  { path: "/nanofiber-research", name: "Nanofiber Research", description: "Review nanofiber research pathways and strategic ecosystem utility in Chaos Star Universe.", indexable: true },
  { path: "/docs", name: "Documentation", description: "Read Chaos Star product guides, economics, sovereignty, and onboarding docs.", indexable: true, schemaType: "Article" },
  { path: "/docs/getting-started", name: "Getting Started", description: "Start your Chaos Star journey with step-by-step onboarding.", indexable: true, schemaType: "Article" },
  { path: "/docs/features", name: "Features", description: "Explore core Chaos Star platform features and gameplay systems.", indexable: true, schemaType: "Article" },
  { path: "/docs/economy", name: "Economy", description: "Understand token flows, sinks, and economic systems in Chaos Star.", indexable: true, schemaType: "Article" },
  { path: "/how-it-works", name: "How It Works", description: "Legacy path redirected to documentation.", indexable: false },
  { path: "/lore", name: "Lore", description: "Discover the worldbuilding and narrative foundations of Chaos Star Universe.", indexable: true },
  { path: "/support", name: "Support Center", description: "Get support for account, transaction, and platform usage questions.", indexable: true, schemaType: "WebPage" },
  { path: "/faq", name: "FAQ", description: "Find quick answers about platform access, deposits, and legal navigation.", indexable: true, schemaType: "FAQPage" },
  { path: "/terms", name: "Terms of Service", description: "Review the terms governing Chaos Star platform usage.", indexable: true, schemaType: "WebPage" },
  { path: "/privacy", name: "Privacy Policy", description: "Understand data handling and privacy controls in Chaos Star Universe.", indexable: true, schemaType: "WebPage" },
  { path: "/cookies", name: "Cookie Policy", description: "Read how cookies and local storage are used for service operations.", indexable: true, schemaType: "WebPage" },
  { path: "/compliance", name: "Compliance", description: "Operational safeguards, auditability, and compliance commitments.", indexable: true, schemaType: "WebPage" },
  { path: "/financial-hub", name: "Financial Hub", description: "Manage assets, portfolio tools, and transactions from the Chaos Star hub.", indexable: false },
  { path: "/digital-id", name: "Digital ID", description: "Manage your account identity and verification controls.", indexable: false },
  { path: "/quick-actions", name: "Quick Actions", description: "Use shortcut operations for frequent account actions.", indexable: false },
];

function getRouteSchemaConfig(pathname: string): RouteSchemaConfig {
  const exactMatch = ROUTE_SCHEMA_CONFIG.find((route) => route.path === pathname);
  if (exactMatch) {
    return exactMatch;
  }

  if (pathname.startsWith("/docs/")) {
    return {
      path: pathname,
      name: "Documentation",
      description: "Read Chaos Star guides, paths, sovereignty, and economy documentation.",
      indexable: true,
      schemaType: "Article",
    };
  }

  return {
    path: pathname,
    name: "Chaos Star Universe",
    description: "Explore Chaos Star Universe features, worlds, and economy tools.",
    indexable: false,
  };
}

export function RouteStructuredData() {
  const location = useLocation();
  const origin = getAppOrigin();

  const routeConfig = useMemo(() => getRouteSchemaConfig(location.pathname), [location.pathname]);
  const pageUrl = `${origin}${location.pathname === "/" ? "" : location.pathname}`;

  if (!routeConfig.indexable) {
    return <DefaultStructuredData />;
  }

  const pageType = routeConfig.schemaType ?? "WebPage";
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: origin,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: routeConfig.name,
      item: pageUrl,
    },
  ];

  return (
    <>
      <DefaultStructuredData />
      <StructuredData
        type={pageType}
        id="structured-data-route-page"
        data={{
          name: routeConfig.name,
          description: routeConfig.description,
          url: pageUrl,
          isPartOf: {
            "@type": "WebSite",
            name: "Chaos Star Universe",
            url: origin,
          },
          inLanguage: "en",
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        id="structured-data-route-breadcrumb"
        data={{
          itemListElement: breadcrumbItems,
        }}
      />
      {pageType === "FAQPage" && (
        <StructuredData
          type="FAQPage"
          id="structured-data-route-faq"
          data={{
            mainEntity: [
              {
                "@type": "Question",
                name: "What is Chaos Star Universe?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Chaos Star Universe is a sandbox platform where users explore star systems, manage digital identity, and participate in a tokenized economy.",
                },
              },
              {
                "@type": "Question",
                name: "Can I own and manage land assets?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Chaos Star supports plot discovery, purchasing, and portfolio management flows for eligible users.",
                },
              },
            ],
          }}
        />
      )}
    </>
  );
}

