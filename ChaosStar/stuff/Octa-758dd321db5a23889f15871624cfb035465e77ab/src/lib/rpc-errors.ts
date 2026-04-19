/**
 * Shared RPC error detection utilities
 * Helps identify when RPC connection errors occur (expected when local node isn't running)
 */

export function isRpcError(error: any): boolean {
  return error?.message?.includes('404') || 
         error?.message?.includes('Not Found') ||
         error?.message?.includes('server response 404') ||
         error?.code === 'NETWORK_ERROR' ||
         error?.code === 'SERVER_ERROR' ||
         error?.status === 404 ||
         error?.message?.includes('ERR_CONNECTION_REFUSED') ||
         error?.message?.includes('fetch failed');
}

export function isConnectionError(error: any): boolean {
  return error?.name === 'AbortError' ||
         error?.name === 'TypeError' ||
         error?.name === 'DOMException' ||
         error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('ERR_CONNECTION_REFUSED') ||
         error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
         error?.message?.includes('NetworkError') ||
         error?.message?.includes('getaddrinfo') ||
         error?.code === 'PGRST116'; // PostgREST connection error
}

export function isSupabaseError(error: any): boolean {
  return error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
         error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('NetworkError') ||
         error?.code === 'PGRST116' ||
         error?.message?.includes('getaddrinfo');
}

