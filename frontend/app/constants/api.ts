/**
 * Base URL for API requests. Use VITE_API_URL in .env for backend URL.
 */
export function getApiBase(): string {
  return (
    (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? ""
  );
}
