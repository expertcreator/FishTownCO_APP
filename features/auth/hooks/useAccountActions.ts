import { router } from "expo-router";
import { useState } from "react";
import { deleteAccount } from "@/features/auth/services/deleteAccount";
import { logout } from "@/features/auth/services/logout";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";
import { useToast } from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import { cancelSubscription } from "@/features/subscription/services/cancelSubscription";

/**
 * Opens Login as the only screen, so the back gesture can't return to the
 * signed-in tabs that were underneath Settings.
 */
function openLoginOnly(): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/(auth)/login");
}

/**
 * Log out and delete-account actions with their confirm-modal state.
 * Used by the Settings screen. Both actions show a toast and return to Login.
 * @returns Modal visibility, loading flags, and the confirm handlers
 */
export function useAccountActions() {
  const { t } = useTranslation();
  const toast = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Deletes the Firebase account and returns to the login screen.
   * A renewing subscription opens the store's manage page first; if it still
   * renews after that, the account is kept and a toast explains why.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const subscription = await cancelSubscription();
      if (subscription === "still-renewing") {
        toast.error(t("auth.delete-account-subscription"));
        return;
      }
      await deleteAccount();
      setDeleteOpen(false);
      toast.success(t("auth.delete-account-success"));
      openLoginOnly();
    } catch (error) {
      const code = getAuthErrorCode(error);
      const message = error instanceof Error ? error.message : "";
      toast.error(
        code === "auth/requires-recent-login"
          ? t("auth.delete-account-recent-login")
          : message === "APPLE_REVOKE_FAILED" ||
            message === "APPLE_TOKEN_MISSING" ||
            message === "APPLE_CODE_MISSING" ||
            message === "APPLE_SIGNIN_CANCELLED"
            ? t("auth.delete-account-apple")
            : t("auth.delete-account-failed")
      );
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Signs out of Firebase Auth and returns to the login screen.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onConfirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
      toast.success(t("auth.log-out-success"));
      openLoginOnly();
    } catch {
      setLogoutOpen(false);
      toast.error(t("auth.log-out-failed"));
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    logoutOpen,
    setLogoutOpen,
    loggingOut,
    onConfirmLogout,
    deleteOpen,
    setDeleteOpen,
    deleting,
    onConfirmDelete,
  };
}
