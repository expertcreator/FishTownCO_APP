export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
