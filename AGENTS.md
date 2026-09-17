# Fishtownco Agent Rules

Goal: Vessel Companion mobile app.

## Structure

- Routes: `app/` (expo-router)
- Features: `features/<feature>/{components,hooks,screens,services,store,types}`
- Shared UI/API/theme/i18n: `shared/` (vendored in this repo)
- Domain helpers: `core/` (vendored)
- Constants: `constants/` (vendored)
- Assets: `assets/` (vendored)

## Patterns

- Path alias: `@/*` → repo root
- Backend: Firebase (configs from client TBD)
- Colors: cream `#F5F0E6`, navy, teal, orange CTA
- Bundle ID: `com.itoasis.Fishtownco`
- Brand id: `fishtownco` only — do not add other marketplace brands

## Design reference

https://fishtownco.itoasis.co/
