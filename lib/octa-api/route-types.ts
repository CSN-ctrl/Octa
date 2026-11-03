import type { ApiRequest, ApiResponse } from "./types";

export type ApiRouteHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export type ApiRouteDefinition = {
  /** Path under `/api/` (no leading slash). Use `:id` for a dynamic segment stored in `req.query.id`. */
  pattern: string;
  handler: ApiRouteHandler;
};
