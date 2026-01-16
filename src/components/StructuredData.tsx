/**
 * Structured Data Component
 * Adds JSON-LD structured data for SEO
 */
import { useEffect } from "react";

interface StructuredDataProps {
  type?: "Organization" | "WebSite" | "WebPage" | "Product";
  data: Record<string, any>;
}

export function StructuredData({ type = "WebSite", data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `structured-data-${type.toLowerCase()}`;
    
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
  }, [type, data]);

  return null;
}

/**
 * Default structured data for the site
 */
export function DefaultStructuredData() {
  // Get origin safely (works in browser environment)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://octavia-universe.com';
  
  return (
    <>
      <StructuredData
        type="Organization"
        data={{
          name: "Octavia Universe",
          url: origin,
          logo: `${origin}/logo.png`,
          description: "Explore star systems, claim land, build your digital identity, and become part of the cosmic economy in Octavia Universe",
          sameAs: [
            // Add social media links when available
          ],
        }}
      />
      <StructuredData
        type="WebSite"
        data={{
          name: "Octavia Universe",
          url: origin,
          description: "Explore star systems, claim land, build your digital identity, and become part of the cosmic economy in Octavia Universe",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${origin}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

