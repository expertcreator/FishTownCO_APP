import { isReservedSlug } from "./reserved-slugs"
import { SLUG_REGEX } from "./schemas"
import {
  isNarrowedAreaListingUrl,
  isNarrowedHomeListingUrl
} from "./listing-filters"

/**
 * Whether a pathname is the `/{city}/{segment}` route shape.
 *
 * The middleware matcher covers every non-asset path, so without this the
 * `X-Robots-Tag` rule would fire on **any** URL carrying a parameter named
 * `sort` — a name generic enough that a future search page, a table or a
 * marketing link will use it, and each of those would silently drop out of the
 * index.
 *
 * Locale prefixes are a parameter rather than a constant because the served
 * locale list is narrowed per app (Rule 4) and core must not know which app is
 * asking. The default locale carries no prefix, so a two-segment path and a
 * three-segment prefixed path are both this shape.
 *
 * A reserved first segment is rejected: `/cart/x` is a 404, not an area page.
 * @param pathname - The request pathname, leading slash included
 * @param localePrefixes - Locale segments this site serves as a URL prefix
 * @returns `true` only for the two-segment catalog shape
 * @example isAreaListingPath("/ur/gujranwala/magnoliya-park", ["ur"]) // -> true
 */
export function isAreaListingPath(
  pathname: string,
  localePrefixes: readonly string[]
): boolean {
  const segments = pathname.split("/").filter((segment) => segment !== "")
  const withoutLocale =
    segments.length > 0 && localePrefixes.includes(segments[0])
      ? segments.slice(1)
      : segments

  if (withoutLocale.length !== 2) {
    return false
  }

  const [city, segment] = withoutLocale

  return (
    !isReservedSlug(city) && SLUG_REGEX.test(city) && SLUG_REGEX.test(segment)
  )
}

/**
 * Whether a path is a city home page — one slug, no area.
 *
 * The same shape check as {@link isAreaListingPath} at a depth of one. Split
 * out rather than parameterised on segment count: the two differ in what they
 * validate, not merely how deep they are, and a shared helper taking a `depth`
 * would read as if `/{city}` and `/{city}/{area}` were the same rule.
 * @param pathname - The request path, locale prefix included or not
 * @param localePrefixes - Prefixes a locale may occupy the first segment with
 * @returns `true` when the path addresses a city home page
 * @example isCityHomePath("/ur/gujranwala", ["ur"]) // -> true
 */
export function isCityHomePath(
  pathname: string,
  localePrefixes: readonly string[]
): boolean {
  const segments = pathname.split("/").filter((segment) => segment !== "")
  const withoutLocale =
    segments.length > 0 && localePrefixes.includes(segments[0])
      ? segments.slice(1)
      : segments

  if (withoutLocale.length !== 1) {
    return false
  }

  const [city] = withoutLocale

  return !isReservedSlug(city) && SLUG_REGEX.test(city)
}

/**
 * Whether a request should be answered with a `noindex, follow` robots header.
 *
 * The requirements say a filtered or sorted view of a catalog page is not
 * indexable. The obvious spelling — `robots: { index: false }` from
 * `generateMetadata` — is unavailable, because that function would have to read
 * `searchParams` to know, and reading them opts the whole route into dynamic
 * rendering and costs the area page its static generation and its ISR. A
 * response header is decided per request without touching the cached body, so
 * the HTML stays byte-identical and only the header differs.
 * @param pathname - The request pathname
 * @param searchParams - The request's query string
 * @param localePrefixes - Locale segments this site serves as a URL prefix
 * @returns `true` when this URL is a narrowed view of an indexable area page
 * @example shouldNoindexListingUrl("/gujranwala/x", new URLSearchParams("?open=1"), ["ur"]) // -> true
 */
export function shouldNoindexListingUrl(
  pathname: string,
  searchParams: URLSearchParams,
  localePrefixes: readonly string[]
): boolean {
  if (isAreaListingPath(pathname, localePrefixes)) {
    return isNarrowedAreaListingUrl(searchParams)
  }

  return (
    isCityHomePath(pathname, localePrefixes) &&
    isNarrowedHomeListingUrl(searchParams)
  )
}
