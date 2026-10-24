import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  isLocalMediaUri,
  pickDisplayMediaUri,
} from "@/features/common/media/mediaStatus";
import {
  formatSafetyDueDate,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import { addWalletDoc } from "@/features/wallet/services/addWalletDoc";
import { fetchWalletDoc } from "@/features/wallet/services/fetchWalletDoc";
import { updateWalletDoc } from "@/features/wallet/services/updateWalletDoc";
import { uploadWalletMediaInBackground } from "@/features/wallet/services/uploadWalletMediaInBackground";
import {
  createAddDocumentSchema,
  WALLET_DOCUMENT_TYPES,
  type AddDocumentSchema,
} from "@/features/wallet/validation/addDocumentSchema";
import {
  AppText,
  BackHeader,
  DatePickerModal,
  FormCard,
  FormField,
  FormScreenSkeleton,
  DocumentUploadField,
  FormSelectField,
  KeyboardAwareContainer,
  OptionsPickerModal,
  PrimaryButton,
  Screen,
  SectionHeader,
  StickyFormFooter,
  useToast,
  type PickerOption,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type DateField = "issueDate" | "expiryDate";

/**
 * Converts a stored date into `dd/mm/yyyy` for the shared form.
 * @param value - ISO, dd/mm/yyyy, or long display date
 * @returns Form date string, or empty
 */
function toFormDate(value?: string | null): string {
  if (!value) return "";
  const parsed = parseSafetyDueDate(value);
  return parsed ? formatSafetyDueDate(parsed) : value;
}

/**
 * Add / Edit Document screen matching prototype screen 17
 * (https://fishtownco.itoasis.co/).
 * `/wallet/add` creates a document. `/wallet/edit/[id]` updates one.
 * Saves to Firestore immediately, then uploads a new file in the background.
 * @returns Document form
 */
export default function AddDocumentScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const schema = useMemo(() => createAddDocumentSchema(t), [t]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const docId = typeof id === "string" && id.length > 0 ? id : "";
  const isEdit = Boolean(docId);
  const {
    data: existing,
    isLoading: isDocLoading,
    isFetching: isDocFetching,
    isError: isDocError,
  } = useQuery({
    queryKey: ["wallet", "doc", docId],
    enabled: isEdit,
    queryFn: () => fetchWalletDoc(docId),
  });
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null
  );

  const { control, handleSubmit, setValue, reset } = useForm<AddDocumentSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      docType: WALLET_DOCUMENT_TYPES[0].label,
      title: "",
      reference: "",
      issueDate: "",
      expiryDate: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const docType = useWatch({ control, name: "docType" });
  const issueDate = useWatch({ control, name: "issueDate" });
  const expiryDate = useWatch({ control, name: "expiryDate" });
  const dateFieldValue =
    activeDateField === "issueDate"
      ? issueDate
      : activeDateField === "expiryDate"
        ? expiryDate
        : "";

  const typeOptions: PickerOption[] = WALLET_DOCUMENT_TYPES.map((type) => ({
    id: type.label,
    label: type.label,
    icon: type.icon,
  }));

  useFocusEffect(
    useCallback(() => {
      if (isEdit) return;
      reset({
        docType: WALLET_DOCUMENT_TYPES[0].label,
        title: "",
        reference: "",
        issueDate: "",
        expiryDate: "",
      });
      setFileUri(null);
      setFileName("");
      setFileMime("");
      setFileError(null);
      setActiveDateField(null);
      setIsSubmitting(false);
      setHydrated(true);
    }, [isEdit, reset])
  );

  useEffect(() => {
    if (!isEdit || !existing || hydrated) return;
    reset({
      docType: existing.docType || WALLET_DOCUMENT_TYPES[0].label,
      title: existing.title || "",
      reference: existing.reference || "",
      issueDate: toFormDate(existing.issueDate),
      expiryDate: toFormDate(existing.expiresIso) || toFormDate(existing.expires),
    });
    setFileUri(
      pickDisplayMediaUri({
        thumbURL: existing.thumbURL,
        downloadURL: existing.downloadURL,
        localUri: existing.localUri,
      })
    );
    setFileName("");
    setFileMime("");
    setFileError(null);
    setHydrated(true);
  }, [existing, hydrated, isEdit, reset]);

  /**
   * Marks the upload as required when no file is attached.
   * @returns Whether a file is present
   */
  const hasRequiredFile = () => {
    if (fileUri?.trim()) {
      setFileError(null);
      return true;
    }
    setFileError(t("validation.required"));
    return false;
  };

  /**
   * Creates or updates the wallet document, then uploads a new file in the background.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: AddDocumentSchema) => {
    if (isSubmitting) return;
    if (!hasRequiredFile()) return;
    setIsSubmitting(true);
    try {
      const expiry = parseSafetyDueDate(values.expiryDate) ?? new Date();
      const newFile = isLocalMediaUri(fileUri) ? fileUri : null;
      const payload = {
        docType: values.docType,
        title: values.title,
        reference: values.reference,
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        expiryDateIso: expiry.toISOString(),
        localUri: newFile,
      };

      if (isEdit) {
        await updateWalletDoc({
          id: docId,
          ...payload,
          replaceFile: Boolean(newFile),
        });
        if (newFile) {
          void uploadWalletMediaInBackground(docId, newFile, {
            fileName,
            mimeType: fileMime,
          });
        }
        toast.success(t("wallet.update-success"));
      } else {
        const created = await addWalletDoc(payload);
        if (newFile) {
          void uploadWalletMediaInBackground(created.id, newFile, {
            fileName,
            mimeType: fileMime,
          });
        }
        toast.success(t("wallet.save-success"));
      }
      router.back();
    } catch (error) {

      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("wallet.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  if (
    (!isEdit && !hydrated) ||
    (isEdit &&
      (!existing || !hydrated) &&
      (isDocLoading || isDocFetching || !isDocError))
  ) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screen}
      >
        <View style={styles.headerPad}>
          <BackHeader
            title={isEdit ? t("wallet.edit-title") : t("wallet.add-doc-title")}
          />
        </View>
        <FormScreenSkeleton />
      </Screen>
    );
  }

  if (isEdit && (isDocError || !existing)) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screen}
      >
        <View style={styles.headerPad}>
          <BackHeader title={t("wallet.edit-title")} />
        </View>
        <AppText style={styles.fileError}>{t("wallet.item-missing")}</AppText>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <View style={styles.headerPad}>
        <BackHeader
          title={isEdit ? t("wallet.edit-title") : t("wallet.add-doc-title")}
        />
      </View>

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <FormCard style={styles.card}>
          <FormSelectField
            control={control}
            name="docType"
            label={t("wallet.doc-type")}
            placeholder={t("wallet.doc-type-placeholder")}
            onPress={() => setTypeOpen(true)}
          />
          <FormField
            control={control}
            name="title"
            label={t("wallet.doc-title")}
            placeholder={t("wallet.doc-title-placeholder")}
          />
          <FormField
            control={control}
            name="reference"
            label={t("wallet.doc-reference")}
            placeholder={t("wallet.doc-reference-placeholder")}
          />
          <FormSelectField
            control={control}
            name="issueDate"
            label={t("wallet.issue-date")}
            placeholder={t("safety.date-placeholder")}
            onPress={() => setActiveDateField("issueDate")}
          />
          <FormSelectField
            control={control}
            name="expiryDate"
            label={t("wallet.expiry-date")}
            placeholder={t("safety.date-placeholder")}
            onPress={() => setActiveDateField("expiryDate")}
          />
        </FormCard>

        <FormCard style={styles.card}>
          <SectionHeader title={t("wallet.upload-file")} />
          <DocumentUploadField
            layout="card"
            uri={fileUri}
            fileName={fileName}
            mimeType={fileMime}
            emptyLabel={t("wallet.upload-file-title")}
            hint={t("wallet.upload-file-hint")}
            filledLabel={t("wallet.file-added")}
            removeAccessibilityLabel={t("crew.remove-cert-file")}
            onChange={(file) => {
              const nextUri = file?.uri ?? null;
              setFileUri(nextUri);
              setFileName(file?.name ?? "");
              setFileMime(file?.mimeType ?? "");
              if (nextUri?.trim()) setFileError(null);
            }}
          />
          {fileError ? (
            <AppText style={styles.fileError}>{fileError}</AppText>
          ) : null}
        </FormCard>
      </KeyboardAwareContainer>

      <StickyFormFooter>
        <PrimaryButton
          label={t("wallet.save-document")}
          icon="save-outline"
          loading={isSubmitting}
          onPress={handleSubmit(
            (values) => {
              void onSubmit(values);
            },
            () => {
              hasRequiredFile();
            }
          )}
        />
      </StickyFormFooter>

      <OptionsPickerModal
        visible={typeOpen}
        title={t("wallet.doc-type")}
        options={typeOptions}
        selectedId={typeOptions.find((o) => o.label === docType)?.id}
        onClose={() => setTypeOpen(false)}
        onSelect={(option) => {
          setValue("docType", option.label, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setTypeOpen(false);
        }}
      />

      <DatePickerModal
        visible={activeDateField !== null}
        initialDate={parseSafetyDueDate(dateFieldValue) ?? new Date()}
        onClose={() => setActiveDateField(null)}
        onConfirm={(date) => {
          if (!activeDateField) return;
          setValue(activeDateField, formatSafetyDueDate(date), {
            shouldValidate: true,
            shouldDirty: true,
          });
          setActiveDateField(null);
        }}
      />
    </Screen>
  );
}

/**
 * Builds add-document styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    headerPad: {
      paddingHorizontal: 20,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    card: { marginBottom: 14 },
    fileError: {
      color: colors.statusOverdueText,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 8,
    },
  });
}
