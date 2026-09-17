import { createPosthogAnalyticsClient } from "./createPosthogAnalyticsClient";

export const posthogAnalyticsClient = createPosthogAnalyticsClient({
  enableSessionReplay: true,
});
