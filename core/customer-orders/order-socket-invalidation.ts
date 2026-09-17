// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * Debounce/throttle for order-refresh sockets (`mw-4-3`, copied verbatim from
 * `mobile-tenant-app`'s `features/orders/utils/orderSocketInvalidation.ts`).
 *
 * Every ambient dependency — clock, timer, canceller — is injected with a real
 * default, which is what makes the module pure enough to live here and testable
 * without fake timers.
 */

type TimerHandle = ReturnType<typeof setTimeout>

type OrderSocketInvalidatorOptions = {
  invalidate: () => void
  now?: () => number
  schedule?: (callback: () => void, delayMs: number) => TimerHandle
  clear?: (handle: TimerHandle) => void
  minIntervalMs?: number
  debounceMs?: number
}

/**
 * Builds a rate-limited invalidator for order sockets, which can fire many
 * events per second while an order moves through the kitchen.
 *
 * Two limits compose. A quiet burst is debounced by `debounceMs`, so a run of
 * events costs one refetch shortly after the last one. A burst arriving less
 * than `minIntervalMs` after the previous invalidation is instead deferred to
 * the exact moment that window closes, so refetches can never land closer
 * together than the minimum interval no matter how loud the socket is. Either
 * way only the latest pending timer survives — each call clears the one before.
 *
 * `cleanup` cancels a pending timer and must be called when the subscriber goes
 * away, or the last timer of a burst fires against a dead consumer.
 * @param options - Injected clock and timer plus the two windows
 * @param options.invalidate - Called when a refetch should actually happen
 * @param options.now - Clock, for testing; defaults to `Date.now`
 * @param options.schedule - Timer, for testing; defaults to `setTimeout`
 * @param options.clear - Timer canceller, for testing; defaults to `clearTimeout`
 * @param options.minIntervalMs - Floor between two invalidations, default 5000
 * @param options.debounceMs - Quiet-period delay, default 1000
 * @returns `debouncedInvalidate` to call per event, and `cleanup` to cancel
 */
export function createOrderSocketInvalidator({
  invalidate,
  now = Date.now,
  schedule = setTimeout,
  clear = clearTimeout,
  minIntervalMs = 5000,
  debounceMs = 1000
}: OrderSocketInvalidatorOptions): {
  debouncedInvalidate: () => void
  cleanup: () => void
} {
  let invalidationTimeout: TimerHandle | null = null
  let lastInvalidation = 0

  const debouncedInvalidate = () => {
    if (invalidationTimeout) {
      clear(invalidationTimeout)
    }

    const timeSinceLastInvalidation = now() - lastInvalidation

    if (timeSinceLastInvalidation < minIntervalMs) {
      const remainingTime = minIntervalMs - timeSinceLastInvalidation
      invalidationTimeout = schedule(() => {
        lastInvalidation = now()
        invalidate()
      }, remainingTime)
      return
    }

    invalidationTimeout = schedule(() => {
      lastInvalidation = now()
      invalidate()
    }, debounceMs)
  }

  const cleanup = () => {
    if (invalidationTimeout) {
      clear(invalidationTimeout)
    }
  }

  return { debouncedInvalidate, cleanup }
}
