import PostHog from "posthog-react-native";
import { Platform } from "react-native";
import type { BaseGrowthEvent, GrowthAnalyticsClient } from "./analyticsTypes";

type PostHogEnvironment = "development" | "staging" | "production";
type ReplayAction =
  | "initialize"
  | "started"
  | "start_failed"
  | "stopped"
  | "stop_failed";

type AnalyticsScalar = string | number | boolean | null;

export type PosthogAnalyticsClientOptions = {
  enableSessionReplay?: boolean;
  replayRetryDelayMs?: number;
};

const REPLAY_EVENT_PREFIX = "session_recording";
const isReplaySupportedPlatform =
  Platform.OS === "ios" || Platform.OS === "android";

function resolvePostHogEnvironment(): PostHogEnvironment {
  const raw =
    process.env.EXPO_PUBLIC_APP_VARIANT ??
    process.env.APP_VARIANT ??
    process.env.EAS_OTA_VARIANT;
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (value === "staging" || value === "production") {
    return value;
  }
  return "development";
}

function environmentProps(): { environment: PostHogEnvironment } {
  return { environment: resolvePostHogEnvironment() };
}

function isPostHogEnabledEnvironment(): boolean {
  return resolvePostHogEnvironment() === "production";
}

export function createPosthogAnalyticsClient(
  options: PosthogAnalyticsClientOptions = {}
): GrowthAnalyticsClient {
  let instance: PostHog | null = null;
  let isReplayStarted = false;
  let replayStartRetryTimeout: ReturnType<typeof setTimeout> | null = null;
  const replayEnabled = options.enableSessionReplay === true;
  const replayRetryDelayMs = options.replayRetryDelayMs ?? 3000;

  function captureReplayLifecycleEvent(
    client: PostHog,
    action: ReplayAction,
    properties: Record<string, AnalyticsScalar>
  ): void {
    client.capture(`${REPLAY_EVENT_PREFIX}.${action}`, {
      ...properties,
      ...environmentProps(),
    });
  }

  async function startReplayAndTrack(
    client: PostHog,
    source: "initial" | "retry"
  ): Promise<void> {
    const wasActive = await client.isSessionReplayActive();
    if (wasActive) {
      isReplayStarted = true;
      captureReplayLifecycleEvent(client, "started", {
        platform: Platform.OS,
        source,
        replay_active_after_start: true,
      });
      return;
    }

    await client.startSessionRecording();
    const isActive = await client.isSessionReplayActive();
    isReplayStarted = isActive;

    if (isActive) {
      captureReplayLifecycleEvent(client, "started", {
        platform: Platform.OS,
        source,
        replay_active_after_start: true,
      });
      return;
    }

    captureReplayLifecycleEvent(client, "start_failed", {
      platform: Platform.OS,
      source,
      reason: "inactive_after_start_call",
    });
  }

  function getOrCreateInstance(): PostHog | null {
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (!(isPostHogEnabledEnvironment() && apiKey)) {
      return null;
    }
    if (instance) {
      return instance;
    }

    instance = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 10_000,
      ...(replayEnabled
        ? {
            enableSessionReplay: true,
            sessionReplayConfig: {
              maskAllTextInputs: true,
              maskAllImages: true,
              maskAllSandboxedViews: true,
              captureLog: true,
              captureNetworkTelemetry: true,
              throttleDelayMs: 1000,
            },
          }
        : {}),
    });
    instance.register(environmentProps());
    return instance;
  }

  function startReplayIfNeeded(client: PostHog): void {
    if (!(replayEnabled && isReplaySupportedPlatform) || isReplayStarted) {
      return;
    }

    client
      .ready()
      .then(async () => {
        captureReplayLifecycleEvent(client, "initialize", {
          platform: Platform.OS,
          replay_enabled_config: true,
          replay_active_before_start: false,
        });

        await startReplayAndTrack(client, "initial");

        if (!isReplayStarted) {
          replayStartRetryTimeout = setTimeout(() => {
            startReplayAndTrack(client, "retry").catch((error: unknown) => {
              captureReplayLifecycleEvent(client, "start_failed", {
                platform: Platform.OS,
                source: "retry",
                reason: "exception",
                message:
                  error instanceof Error
                    ? error.message
                    : "unknown replay retry error",
              });
            });
          }, replayRetryDelayMs);
        }
      })
      .catch((error: unknown) => {
        captureReplayLifecycleEvent(client, "start_failed", {
          platform: Platform.OS,
          source: "initial",
          reason: "exception",
          message:
            error instanceof Error
              ? error.message
              : "unknown session replay initialization error",
        });
      });
  }

  return {
    initialize(
      userId: string | null,
      traits?: { email?: string | null; name?: string | null }
    ): void {
      const client = getOrCreateInstance();
      if (!client) {
        return;
      }

      if (userId) {
        client.identify(userId, {
          ...(traits?.email ? { email: traits.email } : {}),
          ...(traits?.name ? { name: traits.name } : {}),
          app_user_id: userId,
          ...environmentProps(),
        });
      }

      startReplayIfNeeded(client);
    },

    identify(
      distinctId: string | null,
      properties?: Record<string, AnalyticsScalar> | null
    ): void {
      const client = getOrCreateInstance();
      if (!(client && distinctId)) {
        return;
      }
      client.identify(distinctId, {
        ...(properties ?? {}),
        ...environmentProps(),
      });
    },

    capture(event: BaseGrowthEvent): void {
      const client = getOrCreateInstance();
      if (!client) {
        return;
      }

      const { event: eventName, data, ...envelope } = event;
      client.capture(eventName, {
        ...envelope,
        ...(data ?? {}),
        ...environmentProps(),
      });
    },

    registerSuperProperties(props: Record<string, AnalyticsScalar>): void {
      const client = getOrCreateInstance();
      if (!client) {
        return;
      }
      client.register({ ...props, ...environmentProps() });
    },

    reset(): void {
      if (!instance) {
        return;
      }

      if (replayEnabled && isReplaySupportedPlatform && isReplayStarted) {
        const currentInstance = instance;
        if (replayStartRetryTimeout) {
          clearTimeout(replayStartRetryTimeout);
          replayStartRetryTimeout = null;
        }
        captureReplayLifecycleEvent(currentInstance, "stopped", {
          platform: Platform.OS,
          replay_active_before_stop: true,
        });
        currentInstance.stopSessionRecording().catch((error: unknown) => {
          captureReplayLifecycleEvent(currentInstance, "stop_failed", {
            platform: Platform.OS,
            reason: "exception",
            message:
              error instanceof Error
                ? error.message
                : "unknown session replay stop error",
          });
        });
      }

      instance.reset();
      isReplayStarted = false;
      instance = null;
    },

    getExperimentVariant(key: string): string | null {
      const flag = instance?.getFeatureFlag(key);
      if (typeof flag === "string") {
        return flag;
      }
      if (typeof flag === "boolean") {
        return flag ? "test" : "control";
      }
      return null;
    },
  };
}
