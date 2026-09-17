/**
 * Minimal HTTP surface used by core API helpers.
 * Apps adapt axios/ky/fetch to this shape so core stays framework-agnostic.
 */
export type CoreHttpClient = {
  /**
   * Performs a GET and returns the parsed JSON body (not an axios/ky wrapper).
   * @param path - Absolute path on the authenticated API base (e.g. `/orders/:id/flags`)
   * @returns Parsed response body
   */
  get: <T>(path: string) => Promise<T>
  /**
   * Performs a POST with an optional JSON body and returns the parsed JSON body.
   * @param path - Absolute path on the authenticated API base
   * @param body - JSON-serializable request body
   * @returns Parsed response body
   */
  post: <T>(path: string, body?: unknown) => Promise<T>
}
