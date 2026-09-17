import type { QueryClient } from "@tanstack/react-query";
import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin";
import { usePerformanceMonitorDevTools } from "@rozenite/performance-monitor-plugin";
import { useRozeniteStoragePlugin } from "@rozenite/storage-plugin";
import { useTanStackQueryDevTools } from "@rozenite/tanstack-query-plugin";
import { useMemo } from "react";
import { RozeniteAgentTools } from "./rozeniteAgentTools";
import { rozeniteStorageAdapters } from "./rozeniteStorage";

type RozeniteDevToolsProps = {
  queryClient: QueryClient;
};

/**
 * Dev-only Rozenite hooks. Loaded via `require()` in app/_layout when __DEV__.
 * Start Metro with: bun run dev:devtools (WITH_ROZENITE=true).
 */
export function RozeniteDevTools({ queryClient }: RozeniteDevToolsProps) {
  const storages = useMemo(() => rozeniteStorageAdapters, []);

  useNetworkActivityDevTools({
    inspectors: {
      http: true,
      websocket: true,
      sse: false,
    },
  });
  useTanStackQueryDevTools(queryClient);
  useRozeniteStoragePlugin({ storages });
  usePerformanceMonitorDevTools();

  return <RozeniteAgentTools queryClient={queryClient} />;
}
