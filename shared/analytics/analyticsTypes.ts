export type BaseGrowthEvent = {
  event: string;
  data?: Record<string, unknown>;
};

export const COUPON_GROWTH_EVENT_TYPES = {
  COUPON_VIEWED: "coupon.viewed",
  COUPON_APPLIED: "coupon.applied",
  COUPON_REMOVED: "coupon.removed",
  COUPON_FAILED: "coupon.failed",
} as const;

export type CouponGrowthEventType =
  (typeof COUPON_GROWTH_EVENT_TYPES)[keyof typeof COUPON_GROWTH_EVENT_TYPES];

export interface CouponViewedPayload extends Record<string, unknown> {
  coupon_count: number;
}

export interface CouponAppliedPayload extends Record<string, unknown> {
  coupon_id: string;
  coupon_type: "percentage" | "fixed";
  coupon_value: string;
  cart_subtotal: number;
}

export interface CouponRemovedPayload extends Record<string, unknown> {
  coupon_id: string;
}

export interface CouponFailedPayload extends Record<string, unknown> {
  coupon_code: string;
  error_code: string;
}

export type CouponViewedEvent = BaseGrowthEvent & {
  event: typeof COUPON_GROWTH_EVENT_TYPES.COUPON_VIEWED;
  data: CouponViewedPayload;
};

export type CouponAppliedEvent = BaseGrowthEvent & {
  event: typeof COUPON_GROWTH_EVENT_TYPES.COUPON_APPLIED;
  data: CouponAppliedPayload;
};

export type CouponRemovedEvent = BaseGrowthEvent & {
  event: typeof COUPON_GROWTH_EVENT_TYPES.COUPON_REMOVED;
  data: CouponRemovedPayload;
};

export type CouponFailedEvent = BaseGrowthEvent & {
  event: typeof COUPON_GROWTH_EVENT_TYPES.COUPON_FAILED;
  data: CouponFailedPayload;
};

export type CouponGrowthEvent =
  | CouponViewedEvent
  | CouponAppliedEvent
  | CouponRemovedEvent
  | CouponFailedEvent;

/** Contract that all analytics backend implementations must satisfy. */
export type GrowthAnalyticsClient = {
  capture(event: BaseGrowthEvent): void;
  initialize(
    userId: string | null,
    traits?: { email?: string | null; name?: string | null }
  ): void;
  /** PostHog distinct id + person properties (POS / extended identity). */
  identify(
    distinctId: string | null,
    properties?: Record<string, string | number | boolean | null> | null
  ): void;
  registerSuperProperties(
    props: Record<string, string | number | boolean | null>
  ): void;
  reset(): void;
  getExperimentVariant(key: string): string | null;
};

/** Safe no-op that satisfies the interface when analytics are disabled. */
export const noopAnalyticsClient: GrowthAnalyticsClient = {
  capture: () => {},
  initialize: () => {},
  identify: () => {},
  registerSuperProperties: () => {},
  reset: () => {},
  getExperimentVariant: (_key: string) => null,
};
