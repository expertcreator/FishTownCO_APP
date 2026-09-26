import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  isLocalMediaUri,
  pickDisplayMediaUri,
} from "@/features/common/media/mediaStatus";
import { useCrewMember } from "@/features/crew/hooks/useCrewMember";
import { addCrewMember } from "@/features/crew/services/addCrewMember";
import { updateCrewMember } from "@/features/crew/services/updateCrewMember";
import { uploadCrewMediaInBackground } from "@/features/crew/services/uploadCrewMediaInBackground";
import {
  CREW_CERTIFICATE_TYPES,
  createAddCrewSchema,
  type AddCrewSchema,
} from "@/features/crew/validation/addCrewSchema";
import {
  formatSafetyDueDate,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  AppText,
  BackHeader,
  DatePickerModal,
  FormCard,
  FormField,
  FormSelectField,
  ImagePickerSheet,
  KeyboardAwareContainer,
  OptionsPickerModal,
  PrimaryButton,
  Screen,
  SectionHeader,
  StickyFormFooter,
  UploadDropzone,
  useToast,
  type PickerOption,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type DateField = "issueDate" | "expiryDate";

const EMPTY_FORM: AddCrewSchema = {
  name: "",
  role: "",
  phone: "",
  email: "",
  certType: CREW_CERTIFICATE_TYPES[0],
  certTitle: "",
  issueDate: "",
  expiryDate: "",
};

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
 * Shared Add / Edit Crew Member form matching prototype screen 20.
 * - `/crew/add` → create
 * - `/crew/edit/[id]` → update existing Firestore member
 * @returns Crew member form screen
 */
export default function AddCrewMemberScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const schema = useMemo(() => createAddCrewSchema(t), [t]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const memberId = typeof id === "string" && id.length > 0 ? id : "";
  const isEdit = Boolean(memberId);

  const {
    data: member,
    isLoading: isMemberLoading,
    isError: isMemberError,
  } = useCrewMember(memberId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [certTypeOpen, setCertTypeOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [existingCertId, setExistingCertId] = useState<string | undefined>();

  const { control, handleSubmit, setValue, reset, formState } =
    useForm<AddCrewSchema>({
      resolver: zodResolver(schema),
      defaultValues: EMPTY_FORM,
      mode: "onChange",
      reValidateMode: "onChange",
    });

  useFocusEffect(
    useCallback(() => {
      if (isEdit) return;
      reset(EMPTY_FORM);
      setPhotoUri(null);
      setHydrated(true);
      setExistingCertId(undefined);
    }, [isEdit, reset])
  );

  useEffect(() => {
    if (!isEdit || !member || hydrated) return;
    const primary = member.certificates[0];
    reset({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
      certType: primary?.type || CREW_CERTIFICATE_TYPES[0],
      certTitle:
        primary?.title && primary.title !== primary.type ? primary.title : "",
      issueDate: toFormDate(primary?.issueDate),
      expiryDate: toFormDate(primary?.expiresIso || primary?.expires),
    });
    setExistingCertId(primary?.id);
    setPhotoUri(
      pickDisplayMediaUri({
        thumbURL: member.thumbURL,
        downloadURL: member.downloadURL,
        localUri: member.localUri,
      })
    );
    setHydrated(true);
  }, [isEdit, member, hydrated, reset]);

  const certType = useWatch({ control, name: "certType" });
  const issueDate = useWatch({ control, name: "issueDate" });
  const expiryDate = useWatch({ control, name: "expiryDate" });
  const dateFieldValue =
    activeDateField === "issueDate"
      ? issueDate
      : activeDateField === "expiryDate"
        ? expiryDate
        : "";

  const certOptions: PickerOption[] = CREW_CERTIFICATE_TYPES.map((label) => ({
    id: label,
    label,
  }));

  const footerError =
    submitAttempted && !formState.isValid ? t("validation.required") : null;

  /**
   * Creates or updates the crew member in Firestore, kicks off background
   * photo upload when needed, then navigates back without waiting for Storage.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: AddCrewSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const expiry = parseSafetyDueDate(values.expiryDate) ?? new Date();
      const primaryCert = {
        id: existingCertId,
        type: values.certType,
        title: values.certTitle || values.certType,
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        expiryDateIso: expiry.toISOString(),
        hasAttachment: false,
      };

      // Keep additional certificates on edit so multi-cert members are not wiped.
      const restCerts =
        isEdit && member
          ? member.certificates.slice(1).map((cert) => ({
              id: cert.id,
              type: cert.type || cert.title,
              title: cert.title,
              issueDate: cert.issueDate,
              expiryDate: toFormDate(cert.expiresIso || cert.expires),
              expiryDateIso:
                cert.expiresIso ||
                parseSafetyDueDate(cert.expires)?.toISOString() ||
                new Date().toISOString(),
              hasAttachment: Boolean(cert.hasAttachment),
            }))
          : [];

      const newLocalPhoto = isLocalMediaUri(photoUri) ? photoUri : null;
      const hadRemotePhoto = Boolean(
        member?.downloadURL || member?.thumbURL || member?.localUri
      );
      const clearPhoto = isEdit && !photoUri && hadRemotePhoto;

      const payload = {
        name: values.name,
        role: values.role,
        phone: values.phone,
        email: values.email,
        certificates: [primaryCert, ...restCerts],
        localUri: newLocalPhoto,
      };

      if (isEdit) {
        await updateCrewMember({
          id: memberId,
          ...payload,
          clearPhoto,
        });
        if (newLocalPhoto) {
          void uploadCrewMediaInBackground(memberId, newLocalPhoto);
        }
        toast.success(t("crew.update-success"));
      } else {
        const { id } = await addCrewMember(payload);
        if (newLocalPhoto) {
          void uploadCrewMediaInBackground(id, newLocalPhoto);
        }
        toast.success(t("crew.save-success"));
      }
      router.back();
    } catch (error) {
      console.error("[AddCrewMemberScreen] save failed", error);
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("crew.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  if (isEdit && (isMemberLoading || (!hydrated && !isMemberError))) {
    return (
      <Screen scroll={false} edges={["top", "left", "right"]}>
        <BackHeader title={t("crew.edit-title")} />
        <ActivityIndicator color={colors.teal} style={styles.loader} />
      </Screen>
    );
  }

  if (isEdit && (isMemberError || !member)) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <BackHeader title={t("crew.edit-title")} />
        <AppText style={styles.empty}>{t("crew.load-member-failed")}</AppText>
        <PrimaryButton label={t("common.try-again")} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <BackHeader
        title={isEdit ? t("crew.edit-title") : t("crew.add-title")}
      />

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        <FormCard style={styles.card}>
          <FormField
            control={control}
            name="name"
            label={t("crew.full-name")}
            placeholder={t("crew.full-name-placeholder")}
          />
          <FormField
            control={control}
            name="role"
            label={t("crew.role")}
            placeholder={t("crew.role-placeholder")}
          />
          <FormField
            control={control}
            name="phone"
            label={t("crew.mobile")}
            keyboardType="phone-pad"
            placeholder={t("crew.mobile-placeholder")}
          />
          <FormField
            control={control}
            name="email"
            label={t("crew.email")}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t("crew.email-placeholder")}
          />

          <View style={styles.fieldBlock}>
            <AppText style={styles.fieldLabel}>{t("crew.photo")}</AppText>
            <UploadDropzone
              title={photoUri ? t("crew.photo-added") : t("crew.add-photo")}
              hint={t("crew.photo-hint")}
              icon="camera-outline"
              onPress={() => setPickerOpen(true)}
            />
            {photoUri ? (
              <Pressable
                onPress={() => setPhotoUri(null)}
                style={styles.removePhoto}
              >
                <AppText style={styles.removePhotoText}>
                  {t("crew.remove-photo")}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </FormCard>

        <FormCard style={styles.card}>
          <SectionHeader title={t("crew.certificates-section")} />
          <View style={styles.certHeader}>
            <AppText style={styles.certBadge}>
              {t("crew.certificate-n", { n: 1 })}
            </AppText>
            <Pressable onPress={() => toast.info(t("common.coming-soon"))}>
              <AppText style={styles.removeLink}>{t("crew.remove")}</AppText>
            </Pressable>
          </View>

          <FormSelectField
            control={control}
            name="certType"
            label={t("crew.certificate-type")}
            placeholder={t("crew.certificate-type-placeholder")}
            onPress={() => setCertTypeOpen(true)}
          />
          <FormField
            control={control}
            name="certTitle"
            label={t("crew.cert-title")}
            placeholder={t("crew.cert-title-placeholder")}
          />
          <FormSelectField
            control={control}
            name="issueDate"
            label={t("crew.issue-date")}
            placeholder={t("safety.date-placeholder")}
            onPress={() => setActiveDateField("issueDate")}
          />
          <FormSelectField
            control={control}
            name="expiryDate"
            label={t("crew.expiry-date")}
            placeholder={t("safety.date-placeholder")}
            onPress={() => setActiveDateField("expiryDate")}
          />
          <UploadDropzone
            title={t("crew.upload-cert")}
            hint={t("crew.upload-cert-hint")}
            icon="document-text-outline"
            onPress={() => toast.info(t("common.coming-soon"))}
          />
          <Pressable
            onPress={() => toast.info(t("common.coming-soon"))}
            style={styles.addCert}
          >
            <AppText style={styles.addCertText}>
              {t("crew.add-another-cert")}
            </AppText>
          </Pressable>
        </FormCard>
      </KeyboardAwareContainer>

      <StickyFormFooter error={footerError}>
        <PrimaryButton
          label={isEdit ? t("crew.update-member") : t("crew.save-member")}
          icon="save-outline"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit, () => setSubmitAttempted(true))}
        />
      </StickyFormFooter>

      <ImagePickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onImageSelected={(uri) => {
          setPhotoUri(uri);
          setPickerOpen(false);
        }}
      />

      <OptionsPickerModal
        visible={certTypeOpen}
        title={t("crew.certificate-type")}
        options={certOptions}
        selectedId={certOptions.find((o) => o.label === certType)?.id}
        onClose={() => setCertTypeOpen(false)}
        onSelect={(option) => {
          setValue("certType", option.label, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setCertTypeOpen(false);
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
 * Builds add/edit-crew styles for the active palette.
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
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    card: { marginBottom: 14 },
    loader: { marginTop: 40 },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
    },
    fieldBlock: { gap: 8 },
    fieldLabel: {
      color: colors.navy,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    removePhoto: { alignSelf: "flex-start" },
    removePhotoText: {
      color: colors.statusOverdueText,
      fontSize: 13,
      fontWeight: "700",
    },
    certHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    certBadge: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    removeLink: {
      color: colors.statusOverdueText,
      fontSize: 13,
      fontWeight: "700",
    },
    addCert: {
      marginTop: 4,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    addCertText: {
      color: colors.teal,
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
