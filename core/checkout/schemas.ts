import { z } from "zod"

/**
 * The saved-address boundary (`GET users/addresses/`), parsed rather than
 * trusted — and the parse IS the sanitiser: `z.object` strips every key it
 * does not name, so `userId`, coordinates and timestamps never survive into
 * a body a proxy hands the browser. The full backend model is mobile's
 * `addressService.ts:14-45` (`AddressData`); this schema names only what the
 * checkout picker renders.
 */

/**
 * Max saved addresses per user. Mobile's `addressService.ts` constant; must
 * stay aligned with the auth-service limit (Story 11.2).
 */
export const MAX_SAVED_ADDRESSES = 5

/**
 * One saved address, cut to the picker's needs. Optional fields tolerate the
 * backend omitting what this story does not read; unknown fields are
 * stripped by the parse.
 */
export const savedAddressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().nullable().optional(),
  city: z.string(),
  id: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
  label: z.string()
})

/** A parsed saved address. */
export type SavedAddress = z.infer<typeof savedAddressSchema>

/**
 * The list response: `{ success: true, data: AddressData[] }`
 * (mobile's `GetAddressesResponse`). `success` is pinned to `true` so a `200`
 * carrying a refusal fails to parse and is handled as the failure it is.
 */
export const addressListResponseSchema = z.object({
  data: z.array(savedAddressSchema),
  success: z.literal(true)
})

/** A parsed address-list response. */
export type AddressListResponse = z.infer<typeof addressListResponseSchema>

/**
 * Parses an address-list response, reporting drift as absence — the
 * guest-mint parser's posture: every way the body can be wrong means the
 * same thing to the caller, "no list", so one `null` says it.
 * @param value - The decoded response body
 * @returns The sanitised addresses, or `null` when the body is not a list
 * @example parseAddressListResponse({ success: true, data: [] }) // -> []
 */
export function parseAddressListResponse(
  value: unknown
): readonly SavedAddress[] | null {
  const parsed = addressListResponseSchema.safeParse(value)

  return parsed.success ? parsed.data.data : null
}

// ============================================================================
// WRITE PAYLOADS (mw-2-6)
// ============================================================================

/** Longest a saved address's free-text line may be before the form refuses it. */
const ADDRESS_LINE_MAX = 200

/** Longest a saved address's label may be. */
const ADDRESS_LABEL_MAX = 40

/**
 * The address the browser asks to save.
 *
 * **This mirrors the backend's `CreateAddressRequest` and adds nothing.**
 * Mobile's `addressService.ts:14-25` is the closed contract; the reference
 * design's extra inputs ("Floor", "Note to rider") are composed into
 * `addressLine2` by the caller rather than inventing columns the API would
 * discard.
 *
 * Coordinates come from the map pin, never from the geocoder — the geocoder
 * only supplies a suggested label, and it is allowed to fail.
 */
export const addressPayloadSchema = z.object({
  addressLine1: z.string().trim().min(1).max(ADDRESS_LINE_MAX),
  // `undefined`, never `null`, on the way out: the auth service declares this
  // `z.string().optional()`, which refuses `null` with a 400 — and the proxy
  // reads any non-2xx as an outage, so a `null` here surfaced to the visitor
  // as "addresses unavailable". Mobile never hit it because it always sends a
  // string. `JSON.stringify` drops the key entirely, which is what optional
  // means upstream.
  addressLine2: z
    .string()
    .trim()
    .max(ADDRESS_LINE_MAX)
    .nullish()
    .transform((value) => value ?? undefined),
  city: z.string().trim().min(1).max(ADDRESS_LINE_MAX),
  country: z.string().trim().min(1).max(ADDRESS_LINE_MAX),
  isDefault: z.boolean().default(false),
  label: z.string().trim().min(1).max(ADDRESS_LABEL_MAX),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  postalCode: z.string().trim().max(ADDRESS_LINE_MAX).default(""),
  state: z.string().trim().min(1).max(ADDRESS_LINE_MAX)
})

/** An address payload accepted by create and update. */
export type AddressPayload = z.infer<typeof addressPayloadSchema>

/**
 * Validates an address the browser wants to save.
 *
 * Answers the parsed payload or the field paths that failed, so the form can
 * mark the offending inputs instead of showing one opaque error.
 * @param value - The candidate payload
 * @returns `{ ok: true, payload }`, or `{ ok: false, fields }` naming each bad field
 * @example parseAddressPayload({}).ok // -> false
 */
export function parseAddressPayload(
  value: unknown
):
  | { ok: true; payload: AddressPayload }
  | { ok: false; fields: readonly string[] } {
  const parsed = addressPayloadSchema.safeParse(value)

  if (parsed.success) {
    return { ok: true, payload: parsed.data }
  }

  return {
    ok: false,
    fields: [
      ...new Set(
        parsed.error.issues.map((issue) => String(issue.path[0] ?? "unknown"))
      )
    ]
  }
}

/**
 * The single-address response shared by create, update and set-default:
 * `{ success: true, data: AddressData }`.
 */
export const addressMutationResponseSchema = z.object({
  data: savedAddressSchema,
  success: z.literal(true)
})

/**
 * Parses a create / update / set-default response.
 * @param value - The decoded response body
 * @returns The sanitised address, or `null` when the body is not one
 * @example parseAddressMutationResponse({ success: false }) // -> null
 */
export function parseAddressMutationResponse(
  value: unknown
): SavedAddress | null {
  const parsed = addressMutationResponseSchema.safeParse(value)

  return parsed.success ? parsed.data.data : null
}

// ============================================================================
// SERVICEABILITY (mw-2-6)
// ============================================================================

/**
 * Why a branch refused an address, verbatim from the discovery service
 * (`serviceabilityValidation.ts`, `routes/serviceability.ts:12-20`).
 */
export const SERVICEABILITY_REASONS = [
  "OUTSIDE_DELIVERY_RADIUS",
  "OUTSIDE_ONBOARDING_RADIUS",
  "OUTSIDE_COVERAGE_ZONE",
  "NO_RESTAURANT_LOCATION"
] as const

/** One refusal reason. */
export type ServiceabilityReason = (typeof SERVICEABILITY_REASONS)[number]

/**
 * `POST serviceability/validate` request body.
 *
 * `marketplace` is part of the contract for delivery rules.
 */
export const serviceabilityRequestSchema = z.object({
  deliveryAddress: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180)
  }),
  marketplace: z.enum(["fishtownco"]),
  tenantId: z.string().min(1)
})

/** A serviceability request body. */
export type ServiceabilityRequest = z.infer<typeof serviceabilityRequestSchema>

/** The verdict itself, without the transport envelope. */
export const serviceabilityResultSchema = z.union([
  z.object({ serviceable: z.literal(true) }),
  z.object({
    reason: z.enum(SERVICEABILITY_REASONS),
    serviceable: z.literal(false)
  })
])

/** A serviceability verdict. */
export type ServiceabilityResult = z.infer<typeof serviceabilityResultSchema>

/** `{ success: true, data: ServiceabilityResult }`. */
export const serviceabilityResponseSchema = z.object({
  data: serviceabilityResultSchema,
  success: z.literal(true)
})

/**
 * Parses a serviceability response.
 *
 * A body that does not parse answers `null`, never a permissive "serviceable" —
 * an unreadable verdict is an unknown one, and the caller decides what an
 * unknown verdict means rather than having a `true` invented for it.
 * @param value - The decoded response body
 * @returns The verdict, or `null` when the body is not one
 * @example parseServiceabilityResponse({ success: true, data: { serviceable: true } })?.serviceable // -> true
 */
export function parseServiceabilityResponse(
  value: unknown
): ServiceabilityResult | null {
  const parsed = serviceabilityResponseSchema.safeParse(value)

  return parsed.success ? parsed.data.data : null
}

// ============================================================================
// ACCOUNT PROFILE (mw-3-2)
// ============================================================================

/**
 * Longest a name the auth service will store — `UpdateProfileSchema`'s
 * `max(255)`, which is also `users.name`'s `varchar(255)`.
 *
 * Exported so a form can bind it to the input's `maxLength` instead of
 * re-typing the number: an over-long name is otherwise a guaranteed 400 that
 * takes the phone down with it, since the two travel in one patch.
 */
export const PROFILE_NAME_MAX = 255

/** Longest a phone the auth service will store — `UpdateProfileSchema`'s `max(20)`. */
const PROFILE_PHONE_MAX = 20

/**
 * A bound on the picture URL. The upstream states only `.url()`, so this is
 * ours: an S3 object URL is well under 500 characters and an unbounded string
 * on a write is a body-size question nobody has answered.
 */
const PROFILE_IMAGE_MAX = 500

/**
 * The auth service's own phone rule, copied verbatim from
 * `shared/validation/auth.schema.ts` `UpdateProfileSchema.phone`. Copied rather
 * than loosened: a value this rejects is a 400 upstream, and a save that can
 * only fail is worse than one refused before it leaves the process.
 */
const PROFILE_PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/

/**
 * What checkout asks the account to remember: the contact name and phone the
 * visitor just typed, each optional and neither ever empty.
 *
 * **Both fields are optional but the object may not be empty.** The upstream
 * builds its update from the fields it recognises and answers `400 "No valid
 * fields provided for update"` when that object comes out empty
 * (`profile.controllers.ts:815-820`); refusing here means that 400 is
 * unreachable rather than surfaced as an outage.
 *
 * `address`, `latitude`/`longitude`, `familyMemberContact` and `locale` are
 * all accepted upstream and all deliberately absent: `z.object` strips what it
 * does not name, so a caller cannot smuggle them through this proxy.
 *
 * `image` joined the three in `mw-3-5`, when `/account` gained a profile
 * picture. It is an **https** URL — core states the protocol and no more,
 * because the set of hosts we serve pictures from is deployment
 * configuration (`S3_HOSTNAME`) and this package reads no environment. The
 * proxy that accepts this payload is what pins the origin, and it must: a
 * bare `z.url()` here would let a client PATCH `{image:"https://evil.test/x"}`
 * and every surface rendering the account would fetch it.
 */
export const profilePayloadSchema = z
  .object({
    image: z
      .url()
      .max(PROFILE_IMAGE_MAX)
      .refine((value) => value.startsWith("https://"), "https only")
      .optional(),
    name: z.string().trim().min(1).max(PROFILE_NAME_MAX).optional(),
    phone: z
      .string()
      .trim()
      .regex(PROFILE_PHONE_PATTERN)
      .max(PROFILE_PHONE_MAX)
      .optional()
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.phone !== undefined ||
      value.image !== undefined,
    "Nothing to update"
  )

/** A profile patch accepted by `PATCH users/me`. */
export type ProfilePayload = z.infer<typeof profilePayloadSchema>

/**
 * Validates the profile patch the browser wants saved.
 *
 * Mirrors {@link parseAddressPayload}: the parsed payload, or the field paths
 * that failed. An empty object fails at the object level, whose issue carries
 * no path — reported as `"body"`, which is what is actually wrong with it.
 * @param value - The candidate payload
 * @returns `{ ok: true, payload }`, or `{ ok: false, fields }` naming each bad field
 * @example parseProfilePayload({}).ok // -> false
 * @example parseProfilePayload({ phone: "+923001234567" }).ok // -> true
 */
export function parseProfilePayload(
  value: unknown
):
  | { ok: true; payload: ProfilePayload }
  | { ok: false; fields: readonly string[] } {
  const parsed = profilePayloadSchema.safeParse(value)

  if (parsed.success) {
    return { ok: true, payload: parsed.data }
  }

  return {
    ok: false,
    fields: [
      ...new Set(
        parsed.error.issues.map((issue) => String(issue.path[0] ?? "body"))
      )
    ]
  }
}

/**
 * The updated account row, cut to what a checkout save can act on.
 *
 * The upstream echoes a dozen columns (`UpdateProfileResponseSchema`,
 * `auth.schema.ts:130-151`) including `email`, `address`, coordinates and
 * `type`; the parse names three and strips the rest, so none of them can reach
 * the browser through this route.
 */
export const profileMutationResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    name: z.string(),
    phone: z.string().nullable()
  }),
  success: z.literal(true)
})

/** The sanitised account row an update echoes back. */
export type UpdatedProfile = z.infer<
  typeof profileMutationResponseSchema
>["data"]

/**
 * Parses a profile-update response.
 *
 * `null` means "the echo was not readable", never "the update failed" — the
 * write already happened by the time the body is read, exactly as with
 * set-default (`parseAddressMutationResponse`'s caller).
 * @param value - The decoded response body
 * @returns The sanitised row, or `null` when the body is not one
 * @example parseProfileMutationResponse({ success: false }) // -> null
 */
export function parseProfileMutationResponse(
  value: unknown
): UpdatedProfile | null {
  const parsed = profileMutationResponseSchema.safeParse(value)

  return parsed.success ? parsed.data.data : null
}

/**
 * The account row `GET users/me` answers, cut to what `/account` renders.
 *
 * The upstream's `ProfileResponseSchema` (`auth.schema.ts:211-239`) is NOT
 * `.strict()` and carries a dozen more columns — `type`, `locale`, `address`,
 * the coordinates, timestamps. Six are named here and the rest are stripped,
 * for the same reason the mutation echo is narrowed: a field nothing renders
 * is a field that must not cross the proxy.
 *
 * `email` is present and READ-ONLY. `UpdateProfileSchema` does not accept it
 * and the account row is keyed on it, so the page shows it and offers no way
 * to change it.
 */
export const profileReadResponseSchema = z.object({
  data: z.object({
    email: z.email(),
    id: z.string().min(1),
    image: z.string().nullish(),
    name: z.string(),
    phone: z.string().nullish(),
    phoneVerified: z.boolean().nullish()
  }),
  success: z.literal(true)
})

/** The sanitised account row `/account` fills its profile section from. */
export type ReadProfile = z.infer<typeof profileReadResponseSchema>["data"]

/**
 * Parses an own-profile read, reporting drift as absence.
 *
 * `null` here means "there is nothing to render", which is a load FAILURE —
 * the opposite of {@link parseProfileMutationResponse}, whose `null` follows
 * a write that already landed.
 * @param value - The decoded response body
 * @returns The sanitised row, or `null` when the body is not one
 * @example parseProfileReadResponse({ success: false }) // -> null
 */
export function parseProfileReadResponse(value: unknown): ReadProfile | null {
  const parsed = profileReadResponseSchema.safeParse(value)

  return parsed.success ? parsed.data.data : null
}

/**
 * The fields an edit actually changed — mobile's rule at
 * `editProfile.tsx:790-870`, extracted rather than transcribed.
 *
 * `UpdateProfileSchema` is `.strict()` and the controller answers
 * `400 "No valid fields provided for update"` for an empty update object
 * (`profile.controllers.ts:797-802`). Sending only what moved makes that 400
 * unreachable AND stops a phone-shaped no-op from flipping `phoneVerified`
 * false upstream (`:728-734`) for a number the customer never touched.
 *
 * An empty answer is the honest one: there is nothing to save, and the caller
 * is expected to skip the request rather than send `{}`.
 * @param current - The row as loaded
 * @param next - The form's values
 * @returns Only the fields whose value differs; possibly empty
 * @example buildProfileDiff({ name: "A" }, { name: "A", phone: "+92300" }) // -> { phone: "+92300" }
 */
export function buildProfileDiff(
  current: {
    readonly name?: string | null
    readonly phone?: string | null
    readonly image?: string | null
  },
  next: {
    readonly name?: string | null
    readonly phone?: string | null
    readonly image?: string | null
  }
): ProfilePayload {
  const diff: ProfilePayload = {}

  // A blank field is never sent. `users.name` is NOT NULL and the upstream
  // has no way to clear a phone or a picture through this schema, so an
  // emptied box means "leave it alone", not "delete it".
  if (
    typeof next.name === "string" &&
    next.name.trim() !== "" &&
    next.name.trim() !== (current.name ?? "").trim()
  ) {
    diff.name = next.name.trim()
  }

  if (
    typeof next.phone === "string" &&
    next.phone !== "" &&
    next.phone !== (current.phone ?? "")
  ) {
    diff.phone = next.phone
  }

  if (
    typeof next.image === "string" &&
    next.image !== "" &&
    next.image !== (current.image ?? "")
  ) {
    diff.image = next.image
  }

  return diff
}
