export type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};
