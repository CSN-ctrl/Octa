import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";
import {
  buildLandPlotMetadata,
  parsePlotIdFromMetadataPath,
} from "../src/lib/land-nft-metadata";

function landMetadataMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    const match = url.match(/^\/metadata\/land\/([^/]+)\.json$/);
    if (!match || req.method !== "GET") {
      next();
      return;
    }

    const plotId = parsePlotIdFromMetadataPath(match[1]);
    if (plotId == null) {
      res.statusCode = 404;
      res.end("Invalid plot id");
      return;
    }

    const host =
      (req.headers["x-forwarded-host"] as string | undefined) ||
      req.headers.host;
    const proto =
      (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ??
      "http";
    const origin = host ? `${proto}://${host}` : "http://localhost:8080";
    const body = JSON.stringify(buildLandPlotMetadata(plotId, origin));

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end(body);
  };
}

function attach(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(landMetadataMiddleware());
}

/** Serves ERC-1155 metadata JSON in dev/preview so wallets can load plot-preview.png. */
export function landMetadataDevPlugin(): Plugin {
  return {
    name: "land-metadata-dev",
    configureServer: (server) => attach(server),
    configurePreviewServer: (server) => attach(server),
  };
}
