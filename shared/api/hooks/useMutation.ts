import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiResponse } from "../types";

type MutationRequestConfig = Omit<AxiosRequestConfig, "url" | "method" | "data"> & {
  skipUnauthorizedSessionRecovery?: boolean;
};

type UseMutationProps<T, V> = {
  endpoint: string | ((data: V) => string);
  client: AxiosInstance;
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  options?: UseMutationOptions<T, unknown, V, unknown>;
  invalidateQueries?: (string | readonly unknown[])[];
  requestConfig?: MutationRequestConfig;
};

export const useApiMutation = <T, V>({
  endpoint,
  client,
  method = "POST",
  options,
  invalidateQueries = [],
  requestConfig,
}: UseMutationProps<T, V>) => {
  const queryClient = useQueryClient();

  const { onSuccess: originalOnSuccess, ...restOptions } = options || {};

  return useMutation<T, unknown, V, unknown>({
    mutationFn: async (data: V) => {
      const url = typeof endpoint === "function" ? endpoint(data) : endpoint;
      const response = await client.request<ApiResponse<T> | T>({
        url,
        method,
        data,
        ...requestConfig,
      });

      // Handle both wrapped {data: T} and unwrapped T responses
      if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        return response.data as T;
      }
      return response.data as T;
    },
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate queries first
      for (const query of invalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(query) ? query : [query],
        });
      }
      // Then call the original onSuccess if provided
      if (originalOnSuccess) {
        originalOnSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};
