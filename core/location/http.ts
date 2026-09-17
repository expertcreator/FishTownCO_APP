import { PHOTON_BASE_URL } from "./constants"

/**
 * Query string for Photon GET helpers.
 */
export type LocationSearchParams = Record<string, string>

/**
 * Optional headers and abort for a Photon GET.
 */
export type LocationGetOptions = {
  searchParams?: LocationSearchParams
  headers?: Record<string, string>
  signal?: AbortSignal
}

/**
 * Minimal HTTP surface used by location API helpers.
 */
export interface LocationHttp {
  get: <TResponse>(
    path: string,
    options?: LocationGetOptions
  ) => Promise<TResponse>
}

/**
 * Fetch-shaped client used to reach Photon (web or React Native).
 */
export type LocationFetch = (
  input: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal }
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

/**
 * Adapts a fetch implementation into the location transport.
 *
 * No `User-Agent` is set. That header existed to satisfy Nominatim's usage
 * policy, and setting it from a browser is a no-op anyway — the fetch spec
 * lists it as a forbidden header name. Photon asks for no such identification,
 * so the install-id machinery it required is gone with it (`mw-2-6`); that also
 * takes `localStorage` back out of `src/core`, where browser globals are
 * forbidden.
 * @param input - Fetch and an optional Photon origin
 * @param input.fetch - Runtime fetch; defaults to `globalThis.fetch`
 * @param input.baseUrl - Overrides the public Photon origin
 * @returns Typed GET used by `api.ts`
 * @throws {Error} When Photon responds with a non-OK status
 * @example
 * const http = createLocationHttp()
 * await http.get("reverse", { searchParams: { lat: "31.52", lon: "74.35" } })
 */
export function createLocationHttp(input?: {
  fetch?: LocationFetch
  baseUrl?: string
}): LocationHttp {
  const fetchImpl = input?.fetch ?? globalThis.fetch.bind(globalThis)
  const baseUrl = `${(input?.baseUrl ?? PHOTON_BASE_URL).replace(/\/$/, "")}/`

  return {
    get: async <TResponse>(path: string, options?: LocationGetOptions) => {
      const url = new URL(path, baseUrl)
      for (const [key, value] of Object.entries(options?.searchParams ?? {})) {
        url.searchParams.set(key, value)
      }
      const response = await fetchImpl(url.toString(), {
        headers: { ...options?.headers },
        signal: options?.signal
      })
      if (!response.ok) {
        throw new Error(`Photon request failed (${response.status})`)
      }
      return (await response.json()) as TResponse
    }
  }
}
