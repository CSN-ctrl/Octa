import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RouteMetadata } from "./App";

vi.mock("@/lib/app-origin", () => ({
  getAppOrigin: () => "https://www.sarakt.com",
}));

function renderRoute(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <RouteMetadata />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  document.title = "";
  const canonical = document.head.querySelector('link[rel="canonical"]');
  canonical?.remove();
  const robots = document.head.querySelector('meta[name="robots"]');
  robots?.remove();
});

describe("RouteMetadata SEO policy", () => {
  it("sets indexable metadata and canonical root for /universe", () => {
    renderRoute("/universe");

    expect(document.title).toContain("Chaos Star Universe");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("index");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://www.sarakt.com");
  });

  it("applies noindex policy for private routes", () => {
    renderRoute("/dashboard");

    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("noindex");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://www.sarakt.com/dashboard");
  });

  it("keeps docs subroutes indexable with per-route canonical", () => {
    renderRoute("/docs/features");

    expect(document.title).toBe("Documentation - Chaos Star Universe");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("index");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://www.sarakt.com/docs/features");
  });

  it("forces noindex for auth entry routes", () => {
    renderRoute("/login");

    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("noindex");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://www.sarakt.com/login");

    cleanup();
    renderRoute("/signup");

    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("noindex");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://www.sarakt.com/signup");
  });
});
