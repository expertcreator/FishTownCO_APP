import { useCallback } from "react";
import { Toastify } from "./AppToast";
import { ShowToastOptions } from "./AppToast.types";

export function useToast() {
  const success = useCallback((message: string, options?: ShowToastOptions) => {
    Toastify.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: ShowToastOptions) => {
    Toastify.error(message, options);
  }, []);

  const info = useCallback((message: string, options?: ShowToastOptions) => {
    Toastify.info(message, options);
  }, []);

  const warn = useCallback((message: string, options?: ShowToastOptions) => {
    Toastify.warn(message, options);
  }, []);

  const show = useCallback((message: string, options?: ShowToastOptions) => {
    Toastify.show(message, options);
  }, []);

  return {
    success,
    error,
    info,
    warn,
    show,
  };
}
