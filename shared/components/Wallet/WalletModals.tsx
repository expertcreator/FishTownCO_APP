import { FC, type ReactNode, useMemo } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/shared/translations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { useColors } from "@/shared/theme";
import {
  AppText,
  DateRangePicker,
  type DateRange,
} from "@/shared/components";
import AppBottomSheet from "@/shared/components/BottomSheet";
import { OrderFilterModal } from "@/shared/components/OrderFilterModal";
import { formatCurrency as formatCurrencyByCode } from "@/shared/constants/currency";
import { getStyles } from "./Wallet.styles";
import type { TransactionStatus, WalletTransaction } from "./walletViewTypes";

const imageModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export type WalletModalsProps = {
  /** Transaction details sheet */
  selectedTransaction: WalletTransaction | null;
  onCloseTransaction: () => void;
  onResubmit: (tx: WalletTransaction) => void;
  onOpenImageModal: (url: string, transaction: WalletTransaction) => void;
  renderStatusPill: (status: TransactionStatus) => ReactNode;
  walletCurrencyCode: string;

  /** Full-screen image preview (after detail sheet closed) */
  isImageModalVisible: boolean;
  imageModalUrl: string | null;
  onCloseImageModal: () => void;

  /** Date filter (orders-style) + range picker */
  isFilterModalVisible: boolean;
  isDatePickerVisible: boolean;
  dateRange: DateRange;
  onCloseFilterModal: () => void;
  onFilterConfirm: (next: DateRange) => void;
  onFilterReset: () => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDatePickerConfirm: (next: DateRange) => void;

  /**
   * When false, hides the transaction reference row (often labeled "Order ID").
   * Default true so other apps / POS builds keep existing behavior.
   */
  showTransactionReferenceRow?: boolean;
};

const WalletModals: FC<WalletModalsProps> = ({
  selectedTransaction,
  onCloseTransaction,
  onResubmit,
  onOpenImageModal,
  renderStatusPill,
  walletCurrencyCode,
  isImageModalVisible,
  imageModalUrl,
  onCloseImageModal,
  isFilterModalVisible,
  isDatePickerVisible,
  dateRange,
  onCloseFilterModal,
  onFilterConfirm,
  onFilterReset,
  onOpenDatePicker,
  onCloseDatePicker,
  onDatePickerConfirm,
  showTransactionReferenceRow = true,
}) => {
  const { t } = useTranslation();
  const themeColors = useColors();
  const styles = useMemo(() => getStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();

  return (
    <>
      <AppBottomSheet
        isVisible={!!selectedTransaction}
        showDragIndicator
        onClose={onCloseTransaction}
        horizontalMargin={0}
        enablePanDownToClose
        disableBackdropClose={false}
      >
        <View style={styles.transactionModalWrapper}>
          <View style={styles.transactionModalContent}>
            {selectedTransaction && (
              <>
                <View style={styles.transactionModalHeader}>
                  <View style={styles.transactionModalStatusPillWrapper}>
                    {renderStatusPill(selectedTransaction.status)}
                  </View>
                  <AppText style={styles.transactionModalTitle}>
                    {selectedTransaction.title}
                  </AppText>
                </View>
                <AppText style={styles.transactionModalAmount}>
                  {formatCurrencyByCode(
                    selectedTransaction.amountNumber,
                    selectedTransaction.currencyCode || walletCurrencyCode,
                    true
                  )}
                </AppText>
                <View style={styles.transactionModalDivider} />
                {showTransactionReferenceRow &&
                selectedTransaction.reference &&
                !selectedTransaction.hideReference ? (
                  <View style={styles.transactionModalRow}>
                    <AppText style={styles.transactionModalLabel}>
                      {selectedTransaction.type === "cashout"
                        ? t("walletScreen.id-number", "ID Number")
                        : t("walletScreen.order-id", "Order ID")}
                    </AppText>
                    <AppText
                      style={styles.transactionModalValue}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {selectedTransaction.reference}
                    </AppText>
                  </View>
                ) : null}
                <View style={styles.transactionModalRow}>
                  <AppText style={styles.transactionModalLabel}>
                    {t("walletScreen.upload-date-time", "Upload Date / Time")}
                  </AppText>
                  <AppText style={styles.transactionModalValue}>
                    {selectedTransaction.dateTime}
                  </AppText>
                </View>
                {selectedTransaction.status === "rejected" &&
                  selectedTransaction.rejectionReason && (
                    <View style={styles.transactionModalRow}>
                      <AppText style={styles.transactionModalLabel}>
                        {t("walletScreen.rejection-reason", "Rejection Reason")}
                      </AppText>
                      <AppText
                        style={[
                          styles.transactionModalValue,
                          styles.transactionModalValueMultiline,
                        ]}
                        numberOfLines={3}
                      >
                        {selectedTransaction.rejectionReason}
                      </AppText>
                    </View>
                  )}
                {selectedTransaction.proofImageUrl && (
                  <View
                    style={[
                      styles.transactionModalRow,
                      styles.transactionModalImageRow,
                    ]}
                  >
                    <AppText style={styles.transactionModalLabel}>
                      {t("walletScreen.image", "Image")}
                    </AppText>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        const url = selectedTransaction.proofImageUrl;
                        if (url) {
                          onOpenImageModal(url, selectedTransaction);
                        }
                      }}
                    >
                      <Image
                        source={{
                          uri: selectedTransaction.proofImageUrl,
                        }}
                        style={styles.transactionModalImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
          {selectedTransaction?.status === "rejected" && (
            <View style={styles.transactionModalButtonContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.transactionModalResubmitButton}
                onPress={() => {
                  if (selectedTransaction) {
                    onResubmit(selectedTransaction);
                  }
                }}
              >
                <AppText style={styles.transactionModalResubmitText}>
                  {t("walletScreen.re-submit", "Re-Submit")}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </AppBottomSheet>

      <Modal
        visible={isImageModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={onCloseImageModal}
      >
        <View style={imageModalStyles.container}>
          <TouchableOpacity
            style={[imageModalStyles.closeButton, { top: insets.top + 12 }]}
            onPress={onCloseImageModal}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons
              name="close"
              size={moderateScale(28)}
              color={themeColors.text}
            />
          </TouchableOpacity>
          {imageModalUrl ? (
            <Image
              source={{ uri: imageModalUrl }}
              style={imageModalStyles.image}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      <OrderFilterModal
        isVisible={isFilterModalVisible}
        onClose={onCloseFilterModal}
        onConfirm={onFilterConfirm}
        onReset={onFilterReset}
        currentDateRange={dateRange}
        onOpenDatePicker={onOpenDatePicker}
      />
      <DateRangePicker
        value={dateRange}
        onChange={onDatePickerConfirm}
        isVisible={isDatePickerVisible}
        onClose={onCloseDatePicker}
      />
    </>
  );
};

export default WalletModals;
