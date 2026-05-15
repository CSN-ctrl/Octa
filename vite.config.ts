import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** Figma MCP html-to-design capture — dev only (blocked by production CSP in vercel.json). */
const figmaCaptureDevOnly = () => ({
  name: "figma-capture-dev-only",
  transformIndexHtml(html: string) {
    const tag =
      '<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>';
    return html.replace("</body>", `    ${tag}\n  </body>`);
  },
});

// Plugin to bypass host checking in development
const bypassHostCheck = () => ({
  name: "bypass-host-check",
  configureServer(server: ViteDevServer) {
    // Insert middleware before host check to always allow requests
    server.middlewares.stack.unshift({
      route: "",
      handle: (req: any, res: any, next: any) => {
        // Set a valid host header to bypass check
        if (req.headers.host) {
          req.headers.host = "localhost:8080";
        }
        next();
      },
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Expose on local network
    port: 8080,
    strictPort: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 8080,
      clientPort: 8080,
    },
    // Don't set allowedHosts in development - plugin will handle it
    headers: {
      // Allow all sources in development mode for tunneling services and browser extensions
      // Includes Supabase WebSocket connections
      "Content-Security-Policy": mode === "development"
        ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; connect-src * blob: ws: wss: https://*.supabase.co wss://*.supabase.co; script-src * 'unsafe-inline' 'unsafe-eval' blob:; style-src * 'unsafe-inline' https://fonts.googleapis.com; font-src * data: https://fonts.gstatic.com https://fonts.reown.com; frame-src *;"
        : undefined,
    },
  },
  plugins: [
    react(),
    mode === "development" && figmaCaptureDevOnly(),
    mode === "development" && bypassHostCheck(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Polyfill process for browser compatibility (used by some dependencies like Avalanche SDK)
    "process.env": JSON.stringify({
      ...process.env,
      NODE_ENV: mode,
    }),
    global: "globalThis",
    "process.platform": JSON.stringify("browser"),
    "process.browser": JSON.stringify(true),
  },
  build: {
    // Generate source maps for production debugging (hidden = separate .map files, not embedded)
    sourcemap: mode === "production" ? "hidden" : true,
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // Blockchain
          'ethers': ['ethers'],
          // 3D graphics
          'three': ['three'],
          // Charts
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          // Forms
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utils
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
