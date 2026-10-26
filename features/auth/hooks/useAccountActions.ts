import { router } from "expo-router";
import { useState } from "react";
import { deleteAccount } from "@/features/auth/services/deleteAccount";
import { logout } from "@/features/auth/services/logout";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";
import { useToast } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

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
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteOpen(false);
      toast.success(t("auth.delete-account-success"));
      router.replace("/(auth)/login");
    } catch (error) {
      const code = getAuthErrorCode(error);
      toast.error(
        code === "auth/requires-recent-login"
          ? t("auth.delete-account-recent-login")
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
      router.replace("/(auth)/login");
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
