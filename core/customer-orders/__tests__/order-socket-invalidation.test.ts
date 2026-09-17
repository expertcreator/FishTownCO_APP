import assert from "node:assert/strict"
import { describe, it } from "vitest"
import { createOrderSocketInvalidator } from "../order-socket-invalidation"

describe("order socket invalidation debounce", () => {
  it("coalesces bursts inside the 5-second invalidation window", () => {
    let now = 10_000
    let invalidations = 0
    const scheduled: Array<{ callback: () => void; delayMs: number }> = []
    const cleared = new Set<number>()

    const invalidator = createOrderSocketInvalidator({
      now: () => now,
      invalidate: () => {
        invalidations += 1
      },
      schedule: (callback, delayMs) => {
        const handle = scheduled.length
        scheduled.push({ callback, delayMs })
        return handle as unknown as ReturnType<typeof setTimeout>
      },
      clear: (handle) => {
        cleared.add(handle as unknown as number)
      }
    })

    invalidator.debouncedInvalidate()
    assert.equal(scheduled.at(-1)?.delayMs, 1000)
    scheduled[0]?.callback()
    assert.equal(invalidations, 1)

    now = 12_000
    invalidator.debouncedInvalidate()
    invalidator.debouncedInvalidate()

    assert.equal(scheduled.at(-1)?.delayMs, 3000)
    assert.equal(cleared.has(1), true)
    assert.equal(invalidations, 1)

    now = 15_000
    scheduled.at(-1)?.callback()
    assert.equal(invalidations, 2)

    invalidator.cleanup()
    assert.equal(cleared.has(2), true)
  })
})

// --- Added by mw-4-3. Everything above is the mobile suite, verbatim apart
// from its runner import. This is the I/O-matrix burst row.
describe("order socket invalidation burst", () => {
  it("collapses six events inside the 5-second window into one invalidation", () => {
    let now = 0
    let invalidations = 0
    const scheduled: Array<{ callback: () => void; delayMs: number }> = []
    const cleared: number[] = []

    const invalidator = createOrderSocketInvalidator({
      now: () => now,
      invalidate: () => {
        invalidations += 1
      },
      // Handles start at 1: a real `setTimeout` never returns a falsy handle,
      // and the module guards its clear with `if (invalidationTimeout)`.
      schedule: (callback, delayMs) => {
        scheduled.push({ callback, delayMs })
        return scheduled.length as unknown as ReturnType<typeof setTimeout>
      },
      clear: (handle) => {
        cleared.push(handle as unknown as number)
      }
    })

    // Six events, 500 ms apart — the whole burst lands inside one 5 s window.
    for (let index = 0; index < 6; index += 1) {
      now = index * 500
      invalidator.debouncedInvalidate()
    }

    // Six timers were armed, but each superseded the one before it, so only the
    // last can still fire and nothing has invalidated yet.
    assert.equal(scheduled.length, 6)
    assert.deepEqual(cleared, [1, 2, 3, 4, 5])
    assert.equal(invalidations, 0)

    now = 2500
    scheduled.at(-1)?.callback()
    assert.equal(invalidations, 1)

    // Every timer is now either fired or cancelled, so none is left to leak.
    invalidator.cleanup()
    assert.deepEqual(cleared, [1, 2, 3, 4, 5, 6])
  })
})

describe("order socket invalidation cleanup", () => {
  it("is a no-op when nothing was ever scheduled", () => {
    let cleared = 0
    const invalidator = createOrderSocketInvalidator({
      invalidate: () => undefined,
      schedule: () => 1 as unknown as ReturnType<typeof setTimeout>,
      clear: () => {
        cleared += 1
      }
    })
    invalidator.cleanup()
    assert.equal(cleared, 0)
  })
})
