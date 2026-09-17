import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { getLocaleTag, getLocalizedValue } from "../locale"

/** Statement-form imports. JSDoc lines open with `*`, so prose cannot match. */
const IMPORT_STATEMENT = /^\s*import[\s({]/m
/** Deferred loads, which a statement check alone would miss. */
const DYNAMIC_LOAD = /\b(?:require|import)\s*\(/

describe("getLocalizedValue", () => {
  it("answers an empty string for an absent record", () => {
    expect(getLocalizedValue(null, "en")).toBe("")
    expect(getLocalizedValue(undefined, "ar")).toBe("")
  })

  it("reads the Arabic member for an Arabic locale", () => {
    expect(getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "ar")).toBe("دجاج")
  })

  it("falls back English, then value, then empty when Arabic is missing", () => {
    expect(getLocalizedValue({ en: "Chicken" }, "ar")).toBe("Chicken")
    expect(getLocalizedValue({ value: "Chicken" }, "ar")).toBe("Chicken")
    expect(getLocalizedValue({}, "ar")).toBe("")
  })

  it("reads the ur member for both Urdu script and Roman Urdu", () => {
    const record = { en: "Chicken", ur: "Murghi" }

    expect(getLocalizedValue(record, "ur")).toBe("Murghi")
    expect(getLocalizedValue(record, "rmu")).toBe("Murghi")
  })

  it("falls back English, then value, then empty when ur is missing", () => {
    expect(getLocalizedValue({ en: "Chicken" }, "rmu")).toBe("Chicken")
    expect(getLocalizedValue({ value: "Chicken" }, "ur")).toBe("Chicken")
    expect(getLocalizedValue({}, "ur")).toBe("")
  })

  it("prefers English, then Arabic, then value on the default branch", () => {
    expect(getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "en")).toBe(
      "Chicken"
    )
    // Arabic outranks the untagged value for a non-Arabic locale.
    expect(getLocalizedValue({ ar: "دجاج", value: "V" }, "en")).toBe("دجاج")
    expect(getLocalizedValue({ value: "V" }, "en")).toBe("V")
    expect(getLocalizedValue({}, "en")).toBe("")
  })

  it("reduces a locale carrying a region to its language subtag", () => {
    expect(getLocalizedValue({ en: "Chicken" }, "en-US")).toBe("Chicken")
    expect(getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "ar-EG")).toBe(
      "دجاج"
    )
  })

  it("never reads the other script's member", () => {
    // The asymmetry the docblock calls load-bearing: `ar` falls back to `en`,
    // never to `ur`, and the mirror holds. Every other case here proves a
    // branch READS something; these two prove a branch does not.
    expect(getLocalizedValue({ ur: "Murghi" }, "ar")).toBe("")
    expect(getLocalizedValue({ ar: "دجاج" }, "ur")).toBe("")
  })

  it("treats an empty-string member as absent", () => {
    // `||`, not `??`, in every chain. Swapping them would return "" here, and
    // nothing else in this suite would notice.
    expect(getLocalizedValue({ ar: "دجاج", en: "" }, "en")).toBe("دجاج")
    expect(getLocalizedValue({ ar: "", en: "", value: "V" }, "ar")).toBe("V")
  })

  it("survives a locale that is null or undefined at the JS boundary", () => {
    // `locale?.split` is unreachable through the declared `string`, and exists
    // for the untyped callers — persisted language, API payloads — that reach
    // this from three mobile apps.
    const absent = null as unknown as string

    expect(getLocalizedValue({ en: "Chicken" }, absent)).toBe("Chicken")
    expect(getLocaleTag(undefined as unknown as string)).toBe("en-US")
  })

  it("treats an empty or unknown locale as English", () => {
    expect(getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "")).toBe("Chicken")
    expect(getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "fr")).toBe(
      "Chicken"
    )
  })
})

describe("getLocaleTag", () => {
  it("maps Urdu to Pakistan and Arabic to Egypt", () => {
    expect(getLocaleTag("ur")).toBe("ur-PK")
    expect(getLocaleTag("ar")).toBe("ar-EG")
  })

  it("reduces a locale carrying a region before mapping it", () => {
    expect(getLocaleTag("ur-IN")).toBe("ur-PK")
    expect(getLocaleTag("en-US")).toBe("en-US")
  })

  it("formats Roman Urdu, an empty locale and anything unknown as en-US", () => {
    expect(getLocaleTag("rmu")).toBe("en-US")
    expect(getLocaleTag("")).toBe("en-US")
    expect(getLocaleTag("fr")).toBe("en-US")
  })
})

describe("the module's zero-import invariant", () => {
  it("is enforced here rather than only asserted in prose", () => {
    // The one thing that makes this module worth existing: anything it imports
    // is imported by every screen in three shipped apps, through the re-export
    // in mobile-shared-module. Documented in the module docblock, in
    // BOUNDARIES.md and in the spec — and, until this test, checked by nobody.
    // `fileURLToPath` on the string, not `new URL(...)` handed to `readFileSync`:
    // under happy-dom the global `URL` is not Node's, and `readFileSync`
    // rejects it with "The URL must be of scheme file".
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(resolve(here, "../locale.ts"), "utf8")

    expect(source).not.toMatch(IMPORT_STATEMENT)
    expect(source).not.toMatch(DYNAMIC_LOAD)
  })
})
