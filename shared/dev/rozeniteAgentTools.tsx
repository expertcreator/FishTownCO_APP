import { APP_BRAND } from "@/shared/constants";
import { getSessionCacheDebugInfo } from "@/shared/stores/secureSessionStorage";
import type { AgentTool } from "@rozenite/agent-bridge";
import { useRozeniteInAppAgentTool } from "@rozenite/agent-bridge";
import type { QueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBuildInfoTool: AgentTool = {
  name: "get-build-info",
  description: "Return app build metadata (no secrets).",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getSessionCacheTool: AgentTool = {
  name: "get-session-cache",
  description: "Return in-memory session cache flags (no token values).",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getReactQueryCacheTool: AgentTool = {
  name: "get-react-query-cache-summary",
  description: "Return React Query cache key count and query states.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

type RozeniteAgentToolsProps = {
  queryClient: QueryClient;
};

function RozeniteAgentTools({ queryClient }: RozeniteAgentToolsProps) {
  useRozeniteInAppAgentTool({
    tool: getBuildInfoTool,
    handler: () => ({
      brand: APP_BRAND,
      platform: Platform.OS,
      version: Constants.expoConfig?.version ?? null,
      buildNumber:
        Platform.OS === "ios"
          ? Constants.expoConfig?.ios?.buildNumber ?? null
          : Constants.expoConfig?.android?.versionCode ?? null,
      appVariant: process.env.EXPO_PUBLIC_APP_VARIANT ?? null,
    }),
  });

  useRozeniteInAppAgentTool({
    tool: getSessionCacheTool,
    handler: () => getSessionCacheDebugInfo(),
  });

  useRozeniteInAppAgentTool({
    tool: getReactQueryCacheTool,
    handler: () => {
      const queries = queryClient.getQueryCache().getAll();
      return {
        queryCount: queries.length,
        queries: queries.map((query) => ({
          queryKey: query.queryKey,
          state: query.state.status,
          fetchStatus: query.state.fetchStatus,
        })),
      };
    },
  });

  return null;
}

export { RozeniteAgentTools };
