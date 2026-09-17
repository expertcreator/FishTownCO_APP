import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import { ApiResponse } from "../types";

type UseFetchProps<T> = {
  key: string | readonly unknown[];
  endpoint: string;
  client: AxiosInstance;
  params?: Record<string, unknown>;
  /**
   * When true, appends `params` to the query key.
   * Default false — callers should encode cache identity in `key`
   * (avoids unstable objects like raw GPS floats changing the key).
   */
  includeParamsInKey?: boolean;
  options?: Omit<
    UseQueryOptions<ApiResponse<T>, unknown, T, readonly unknown[]>,
    "queryKey" | "queryFn"
  >;
};

export const useFetch = <T>({
  key,
  endpoint,
  client,
  params,
  includeParamsInKey = false,
  options,
}: UseFetchProps<T>) => {
  const baseKey = Array.isArray(key) ? [...key] : [key];
  const queryKey = (
    includeParamsInKey ? [...baseKey, params] : baseKey
  ) as readonly unknown[];

  return useQuery<ApiResponse<T>, unknown, T, readonly unknown[]>({
    queryKey,
    queryFn: async () => {
      const response = await client.get<ApiResponse<T>>(endpoint, { params });
      return response.data;
    },
    ...options,
  });
};
