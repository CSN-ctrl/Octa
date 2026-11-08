import type { ApiRequest, ApiResponse } from "../types";

type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

declare module "./nodes.cjs" {
  const handler: ApiHandler;
  export default handler;
}

declare module "./permits.cjs" {
  const handler: ApiHandler;
  export default handler;
}

declare module "./misc.cjs" {
  const handler: ApiHandler;
  export default handler;
}
