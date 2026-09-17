import { useMemo } from "react";
import { useAlertStore, type AlertOptions } from "./alertStore";

type UseAlertResult = {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  clearAlert: () => void;
};

export const useAlert = (): UseAlertResult => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const hideAlert = useAlertStore((state) => state.hideAlert);
  const clearAlert = useAlertStore((state) => state.clearAlert);

  return useMemo(
    () => ({
      showAlert,
      hideAlert,
      clearAlert,
    }),
    [showAlert, hideAlert, clearAlert]
  );
};
