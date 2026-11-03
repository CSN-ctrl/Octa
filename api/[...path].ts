import type { ApiRequest, ApiResponse } from "./_lib/types";
import { dispatchApiRoute, normalizePathSegments } from "./_lib/router";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const segments = normalizePathSegments(req.query?.path as string | string[] | undefined);
  await dispatchApiRoute(segments, req, res);
}
