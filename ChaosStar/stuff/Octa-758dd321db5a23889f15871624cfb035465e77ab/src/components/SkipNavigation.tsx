/**
 * Skip Navigation Component
 * Provides keyboard navigation shortcut to skip to main content
 * Improves accessibility for screen readers and keyboard users
 */
import { useEffect } from "react";

export function SkipNavigation() {
  useEffect(() => {
    // Focus management for skip link
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content with Alt+S (common pattern)
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        const main = document.querySelector("main") || document.querySelector("#root > div > div:last-child");
        if (main) {
          (main as HTMLElement).focus();
          (main as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={(e) => {
        e.preventDefault();
        const main = document.querySelector("main") || document.querySelector("#root > div > div:last-child");
        if (main) {
          (main as HTMLElement).focus();
          (main as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      Skip to main content
    </a>
  );
}

