# Cross-package boundaries

Rules for **where a piece of logic is allowed to land** across the five shared
packages, and **what a copy obliges you to do afterwards**. Ecosystem-scoped: it
binds all six consuming apps equally — three web (marketplace, tenant admin,
super admin) and three mobile (customer, driver, POS).

Scope check before you read further:

| Question | Where the answer lives |
| --- | --- |
| Does this belong in `constants` or in `core`? | web `AGENTS.md`, Rule 1 → *There are two core packages. Know which one.* (`AGENTS.md:102-169` in `frontend-marketplace-web`) — **not repeated here** |
| How do I lay out a domain folder inside this package? | `AGENTS.md` and `README.md` next to this file |
| Which package may a thing land in, and what does copying it cost? | this file |

Every claim below carries an anchor: a path, a `path:line`, or the command that
reproduces it. All re-verified **2026-08-30**. Anchors written `<app>/…` are
relative to that app's repository root. `core/` is this submodule; it is mounted
at `src/core` in the three web apps and `core` in the three mobile apps, so read
`core/AGENTS.md` as `src/core/AGENTS.md` if you are in a web app.

---

## 1. The shared packages, and who mounts which

**Six apps** consume these packages. Three are Next.js and mount under `src/`:
`frontend-marketplace-web`, `frontend-tenant-admin`, `frontend-super-admin-main`.
Three are Expo and mount at the repo root: `mobile-tenant-app`,
`mobile-tenant-driver`, `mobile-tenant-pos`. (`fishtownco-marketing` is the seventh
frontend repo and mounts nothing — it consumes no shared package.)

Reproduce with `git config -f .gitmodules --get-regexp 'submodule\..*\.(path|url)'`
in any app root.

| Package (GitLab repo under `fishtownco/`) | mounted by the 3 web apps as | mounted by the 3 mobile apps as |
| --- | --- | --- |
| `fishtownco-frontend/frontend-core` — **this package** | `src/core` | `core` |
| `fishtownco-frontend/shared-constants` | `src/constants` | `constants` |
| `fishtownco-frontend/frontend-shared-assets` | `public` | `assets` |
| `fishtownco-frontend/frontend-shared-module` | `src/shared` | — not mounted |
| `fishtownco-mobile/mobile-shared-module` | — **not mounted** | `shared` |

Two consequences, and they are the whole reason this section exists:

- **Three packages are mounted by all six apps** — `frontend-core`,
  `shared-constants`, `frontend-shared-assets`. The two `shared` modules split the
  fleet three/three. Since `frontend-shared-assets` holds fonts and images,
  **`core` and `constants` are the only two places shared *logic* can reach every
  app.** Anything more than one surface needs goes into one of those two.
- **Web cannot see `mobile-shared-module`, and mobile cannot see
  `frontend-shared-module`.** They are different repositories that happen to
  share a directory name. Putting web-needed logic in `shared/` on the mobile
  side puts it somewhere web can never import from. Check
  `frontend-marketplace-web/.gitmodules` — there is no
  `mobile-shared-module` entry.

`constants` (`shared-constants`) is mounted by all six frontends **and by all five
backends** — `authentication-service-backend`, `backend-super-admin-main`,
`business-discovery-backend`, `business-management-backend`, `notify-service`, each
at `src/constants` (same reproduce command in any backend root). That is an
**11-repo** blast radius, and it is why the placement table in web's `AGENTS.md`
Rule 1 exists. Read that table before choosing between `constants` and `core`.

`frontend-core`, by contrast, is mounted by **zero** backends — six repos, not
eleven. That gap is the entire economic argument for the two-package split.

---

## 2. How a cross-submodule import resolves

There is no package manifest, no `dependencies` entry, and no workspace link
between these submodules. `mobile-shared-module` has **no `package.json` at all**
(`ls <app>/shared/package.json` → no such file). What makes
`import … from "@/core/…"` work inside a submodule is the **host app's path
alias**, resolved against the host app's directory layout:

| App | `tsconfig.json` `paths` | `@/core` resolves to |
| --- | --- | --- |
| `frontend-marketplace-web` | `"@/*": ["./src/*"]` (`tsconfig.json:23`) | `src/core` |
| `frontend-tenant-admin` | `"@/*": ["./src/*"]` (`tsconfig.json:23`) | `src/core` |
| `frontend-super-admin-main` | `"@/*": ["./src/*"]` (`tsconfig.json:24`) | `src/core` |
| `mobile-tenant-app` | `"@/*": ["./*"]` | `core` |
| `mobile-tenant-driver` | `"@/*": ["./*"]` | `core` |
| `mobile-tenant-pos` | `"@/*": ["./*"]` | `core` |

So a file inside `shared/` that writes `@/core/orders` is not declaring a
dependency on `core`. It is asking its **host app** to have a sibling directory
called `core` (or `src/core`). All six apps do (section 1), so the import resolves
in all six — and it would break instantly in any app that stopped mounting `core`.

### A shared module importing `@/core` is an existing pattern

**On the web side it already ships.** `frontend-shared-module` (mounted at
`src/shared` by all three web apps) imports `@/core` in **6 files** — value
imports, not types: `src/shared/products/utils/transform-product-res.ts:1` and
`src/shared/products/components/menu-slugs-field.tsx:8` (`@/core/daypart-menus`),
`src/shared/components/order-history-card.tsx:12,28` (`@/core/orders`),
`src/shared/components/select-location-modal.tsx:12`,
`src/shared/components/osm-address-search.tsx:13` and
`src/shared/hooks/use-current-address.ts:4` (`@/core/location`). It also imports
`@/constants` in 26 files. So the edge this section is about is not a proposal —
it is running in production in the admin apps today.

**On the mobile side it does not exist yet**, and that is the only open case.
`mobile-shared-module` reaches sideways into two sibling submodules, but not
into `core`:

- **`@/assets`** — value imports, not just types. `shared/utils/i18n.ts:4-7` is
  four JSON message imports; `shared/constants/fonts.ts` and
  `shared/constants/images.ts` add 98 more `@/assets` lines between them (68 + 30,
  `grep -c '@/assets' shared/constants/images.ts shared/constants/fonts.ts`).
- **`@/constants`** — 3 references across 2 files, all `import type`:
  `shared/types/db.ts:16`, `shared/types/db.ts:17`, `shared/api/client.ts:1`.

`grep -rl "@/core" --include="*.ts" --include="*.tsx" <mobile-app>/shared` returns
**zero** today. The first one is therefore the third *kind* of cross-submodule
edge in `mobile-shared-module` — after `@/assets` and `@/constants` — and a
pattern `frontend-shared-module` has already been running for months. New
instance, not new mechanism.

Beware the mount-path trap when you run that grep: in a **web** app `shared` is
`frontend-shared-module` at `src/shared` and the same grep returns 6, not zero.
Two different repositories, same directory name (section 1).

App code, as opposed to `shared/`, already imports `core` freely — so the alias
mechanism is proven at runtime, not just in theory:

| App | app-code files importing `@/core` | domains, by import line |
| --- | --- | --- |
| `frontend-tenant-admin` | 91 | `cash-drawers` ×31, `pos-orders` ×27, `orders` ×18, `daypart-menus` ×15, `subscriptions` ×8, `categories` ×6, `location` ×3 |
| `frontend-super-admin-main` | 25 | `subscriptions` ×21, `location` ×3, `daypart-menus` ×2, `orders` ×2 |
| `mobile-tenant-app` | 2 | `order-flags` |
| `mobile-tenant-driver` | 2 | `order-flags` |
| `mobile-tenant-pos` | 41 | `pos-orders` ×25, `cash-drawers` ×11, `orders` ×4, `order-flags` ×4 |

Reproduce (drop the submodule's own files, whose mount path is `core` on mobile
and `src/core` on web):

```sh
grep -rl "@/core" --include="*.ts" --include="*.tsx" <app> \
  | grep -v node_modules | grep -v "^<app>/\(src/\)\?core/"
```

### Nothing will catch you if you get it wrong

Assume no safety net, because there is none:

- `mobile-shared-module` has no `package.json`, so no typecheck or build script
  of its own.
- Its `.gitlab-ci.yml` declares one stage (`comment`) and one job
  (`comment-on-mr-job`, extending a shared MR-comment template). No typecheck, no
  build, no test.
- `mobile-tenant-app/tsconfig.json` lists **`core` in `exclude`**, so that app's
  `tsc` does not typecheck this package at all. `mobile-tenant-driver` and
  `mobile-tenant-pos` do not exclude it (they exclude `shared/dev/**` and
  `shared/utils/prefetchImages.ts` instead).

A broken cross-submodule import can therefore reach `development` in
`mobile-shared-module`, sit there through CI, and only surface when an app bumps
its pin.

---

## 3. Pin ordering: commit `core` first, always

The packages are pinned independently, and the pins drift. **All six apps carry a
`core` pin**, so the ordering rule below binds all six — not just the ones this
epic happens to be working in. Snapshot `2026-08-30`; reproduce with
`git ls-tree HEAD src/core src/shared src/constants public` (web apps) or
`git ls-tree HEAD core shared constants assets` (mobile apps):

| App | `core` pin | pin date |
| --- | --- | --- |
| `frontend-marketplace-web` | the commit that added this file | 2026-08-30 |
| `frontend-tenant-admin` | `b6f66849` | 2026-08-28 |
| `frontend-super-admin-main` | `b6f66849` | 2026-08-28 |
| `mobile-tenant-driver` | `56f8f9fc` | 2026-08-27 |
| `mobile-tenant-pos` | `56f8f9fc` | 2026-08-27 |
| `mobile-tenant-app` | `75832301` | 2026-08-20 |

Ten days of spread, five distinct pins across six apps. How far behind any one of
them is changes with every `core` commit, so the count is not printed here —
measure it when you need it, and say what against:

```sh
git -C <app>/<core-mount> rev-list --count <pin>..origin/development
```

`mobile-shared-module` is pinned at **three different commits** — `fa59dd0f`
(tenant-app), `3fd0e34f` (driver), `614674a4` (pos) — which is why it can never
be the home for anything more than one app needs. `frontend-shared-module` is
pinned at `30a9b836` by both admin apps and at `70d623db` by web.

The drift is not theoretical. `core/orders/` at web's pin has 7 modules; at POS's
pin it has the same 7; at `mobile-tenant-app`'s pin it has **2** (`history.ts`,
`index.ts`). Same path, different contents, depending on who is reading — and
`frontend-tenant-admin` imports `@/core/orders` from 17 files against a third pin
again.

On the **web** side this constraint already exists: `frontend-shared-module`
imports `@/core` in 6 files (§2), so a `src/shared` bump in an admin app already
implies a compatible `src/core` pin.

On the **mobile** side `core` and `shared` are still independent — bumping one
says nothing about the other. **The first `shared/` → `@/core` import ends that.**
From that commit on, a `shared` bump implicitly requires a `core` pin new enough
to contain what `shared` now imports: a two-submodule ordering constraint where
mobile had one.

The rule that follows, and it has no exceptions:

1. Commit and merge in **`core`** first.
2. Then bump the `core` pin in the consuming app, **by content** — re-point at
   the commit that actually landed on `core`'s `development`, not at your local
   pre-merge SHA.
3. Only then commit or merge the app-side change that needs it.

Reverse that order and the app pins a commit no one else can fetch. This track
has already produced that failure repeatedly at one level of depth; a
`shared` → `core` edge adds a second.

Apps left on older pins keep compiling as long as extractions preserve the
original import paths — which is what section 5 is for.

---

## 4. Copy, not move — and the ticket that makes it not-debt

Extractions into `core` are **copies**. The mobile original stays where it is and
keeps working. This deliberately *increases* duplication in the short term.

The obligation a copy creates is **a ticket, not a refactor**:

- When a surface ships on extracted `core` logic, file a ticket for the mobile
  developer to re-point mobile at the same `core` module.
- The extracting story is done when the extracting app is done. **Do not edit a
  mobile app to close out your own extraction.** Mobile is a shipped app;
  reworking it ahead of the consumer blocks the consumer and risks shipped
  software for no near-term gain.
- The ticket is the deliverable. A copy with no ticket behind it is the only
  version of this that is actually debt.

Those tickets accumulate against the deferred retrofit story **mw-4-13**, which
is worked screen by screen, opportunistically, by whoever is already in that
file. Filing one is what triggers it; nothing else does.

### The live instance of this rule

`core/orders/` (7 modules, 1,029 lines, `history.ts` at 318) coexists with
`mobile-tenant-app/features/orders/utils/orderStatusHistory.ts` (98 lines, 3
importers: `features/orders/screens/CompleteOrderDetailScreen.tsx:30`,
`features/orders/components/OrderCard/OrderCard.tsx:19`,
`features/orders/components/OrderStatusHistory/OrderStatusHistory.tsx:8`).

They are different logic with different call sites — `core/orders/history.ts`
exports `getOrderHistoryEvents` / `getOrderCreatedActorName` over an event model;
the mobile helper exports five label-and-sort formatters. `mobile-tenant-app`
imports `@/core/orders` **zero** times (`mobile-tenant-pos` imports it 4 times).

This is accepted as-is. Do not reconcile it as a side effect of another story.
It is what the rule looks like in practice, not a bug in it.

---

## 5. Default to extract-and-re-export

For anything with a wide existing call-site footprint, do not perform a literal
move. Extract the logic into `core`, then leave a re-export behind at the old
path:

```ts
// <app>/features/orders/utils/orderTotals.ts
export { computeOrderTotals } from "@/core/orders"
```

Why this is the default:

- A many-file edit becomes a two-file change.
- Existing importers are byte-identical in behaviour and need no edit — so no
  churn in screens nobody is otherwise touching.
- **No forced pin bump.** Apps still on an older `core` keep compiling, because
  the import path they use did not change.

Move literally only when the old path has no importers left, or when the
re-export would itself pull a platform dependency into `core` — which it must
never do (see `AGENTS.md` → *What belongs here*, and Rule 1's never-in-core list).

If the extraction has a **platform-coupled** part — storage, secure store, i18n
init at module load, a clock — do not branch inside `core`. Declare an interface
in `core` and let each app supply the implementation. Rule 1 in web's `AGENTS.md`
carries the current interface-per-platform table; `catalog/`'s `CatalogTransport`
in this package is the worked example.

---

## Quick reference

| You are about to… | Do this |
| --- | --- |
| Pick between `constants` and `core` | Read web `AGENTS.md:102-169`. Money math, enums, state machines, permissions → `constants` — 6 frontends + 5 backends = **11 repos**. |
| Put shared logic in mobile's `shared/` | Stop. No web app mounts `mobile-shared-module`, and its three pins differ. Use `core`. |
| Read a claim about "`shared`" | Check which repo: `src/shared` = `frontend-shared-module` (3 web apps), `shared` = `mobile-shared-module` (3 mobile apps). Different repos, same name. |
| Import `@/core` from a shared module | Already shipping in `frontend-shared-module` (6 files); would be a first for `mobile-shared-module`. Either way you now own the pin-ordering rule in §3. |
| Commit a `core` change plus an app change | `core` first, merge it, re-point the pin by content, then the app. |
| Move logic out of a mobile screen | Copy it. Leave a re-export. File the mw-4-13 ticket. Do not edit the other apps. |
