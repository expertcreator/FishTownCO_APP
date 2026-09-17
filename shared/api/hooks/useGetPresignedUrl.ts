import { apiClient } from "@/features/common/api/apiClient";
import { UPLOAD } from "@/features/common/api/endpoints";
import { useApiMutation } from "./useMutation";

export type PresignedUrlRequest = {
  name: string;
  size: number;
  type: string;
  folder: string;
};

export type PresignedUrlResponse = {
  presignedUrl: string;
  objectUrl: string;
  success: boolean;
  fields?: Record<string, string>;
};

export const useGetPresignedUrl = () =>
  useApiMutation<PresignedUrlResponse, PresignedUrlRequest>({
    endpoint: UPLOAD.PRESIGNED_URL,
    client: apiClient,
    method: "POST",
  });
