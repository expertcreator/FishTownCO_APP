import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import type { MediaStatus } from "@/features/common/media/mediaStatus";
import {
  isLocalMediaUri,
  pickDisplayMediaUri,
} from "@/features/common/media/mediaStatus";
import { useCrewMember } from "@/features/crew/hooks/useCrewMember";
import { addCrewMember } from "@/features/crew/services/addCrewMember";
import { updateCrewMember } from "@/features/crew/services/updateCrewMember";
import { uploadCrewCertificateMediaInBackground } from "@/features/crew/services/uploadCrewCertificateMediaInBackground";
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
  Field,
  FormCard,
  FormField,
  ImagePickerSheet,
  KeyboardAwareContainer,
  OptionsPickerModal,
  PrimaryButton,
  Screen,
  SectionHeader,
  SelectField,
  StickyFormFooter,
  UploadDropzone,
  useToast,
  type PickerOption,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type CertDraft = {
  key: string;
  id?: string;
  type: string;
  title: string;
  issueDate: string;
  expiryDate: string;
  localUri?: string | null;
  downloadURL?: string | null;
  thumbURL?: string | null;
  storagePath?: string | null;
  mediaStatus?: MediaStatus;
};

type DateTarget = { certKey: string; field: "issueDate" | "expiryDate" };
type MediaTarget =
  | { kind: "photo" }
  | { kind: "certificate"; certKey: string };

const EMPTY_FORM: AddCrewSchema = {
  name: "",
  role: "",
  phone: "",
  email: "",
};

/**
 * Creates an empty certificate draft for the Add Crew form.
 * @returns New certificate draft
 */
function createEmptyCertDraft(): CertDraft {
  return {
    key: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: CREW_CERTIFICATE_TYPES[0],
    title: "",
    issueDate: "",
    expiryDate: "",
    localUri: null,
    downloadURL: null,
    thumbURL: null,
    storagePath: null,
    mediaStatus: "none",
  };
}

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
 * Supports multiple certificates and certificate image uploads.
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
  const [certificates, setCertificates] = useState<CertDraft[]>([
    createEmptyCertDraft(),
  ]);
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [certTypeKey, setCertTypeKey] = useState<string | null>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<AddCrewSchema>({
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
      setCertificates([createEmptyCertDraft()]);
      setSubmitAttempted(false);
      setHydrated(true);
    }, [isEdit, reset])
  );

  useEffect(() => {
    if (!isEdit || !member || hydrated) return;
    reset({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
    });
    setPhotoUri(
      pickDisplayMediaUri({
        thumbURL: member.thumbURL,
        downloadURL: member.downloadURL,
        localUri: member.localUri,
      })
    );
    setCertificates(
      member.certificates.length > 0
        ? member.certificates.map((cert) => ({
            key: cert.id,
            id: cert.id,
            type: cert.type || CREW_CERTIFICATE_TYPES[0],
            title:
              cert.title && cert.title !== cert.type ? cert.title : "",
            issueDate: toFormDate(cert.issueDate),
            expiryDate: toFormDate(cert.expiresIso || cert.expires),
            localUri: cert.localUri ?? null,
            downloadURL: cert.downloadURL ?? null,
            thumbURL: cert.thumbURL ?? null,
            storagePath: cert.storagePath ?? null,
            mediaStatus: cert.mediaStatus ?? "none",
          }))
        : [createEmptyCertDraft()]
    );
    setHydrated(true);
  }, [isEdit, member, hydrated, reset]);

  const certOptions: PickerOption[] = CREW_CERTIFICATE_TYPES.map((label) => ({
    id: label,
    label,
  }));

  const certsValid = certificates.every(
    (cert) => cert.type.trim() && cert.issueDate.trim() && cert.expiryDate.trim()
  );
  const footerError =
    submitAttempted && (!formState.isValid || !certsValid)
      ? t("validation.required")
      : null;

  const activeCertType =
    certificates.find((cert) => cert.key === certTypeKey)?.type ?? "";
  const activeDateValue = dateTarget
    ? certificates.find((cert) => cert.key === dateTarget.certKey)?.[
        dateTarget.field
      ] ?? ""
    : "";

  /**
   * Updates one certificate draft field.
   * @param key - Draft key
   * @param patch - Partial certificate fields
   * @returns void
   */
  const patchCert = (key: string, patch: Partial<CertDraft>) => {
    setCertificates((prev) =>
      prev.map((cert) => (cert.key === key ? { ...cert, ...patch } : cert))
    );
  };

  /**
   * Creates or updates the crew member, then uploads photo / cert media
   * in the background without blocking navigation.
   * @param values - Validated person fields
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: AddCrewSchema) => {
    if (isSubmitting) return;
    setSubmitAttempted(true);
    if (!certsValid) return;
    setIsSubmitting(true);
    try {
      const certPayload = certificates.map((cert, index) => {
        const expiry = parseSafetyDueDate(cert.expiryDate) ?? new Date();
        const newLocal = isLocalMediaUri(cert.localUri) ? cert.localUri : null;
        const keepRemote = !newLocal
          ? {
              downloadURL: cert.downloadURL ?? null,
              thumbURL: cert.thumbURL ?? null,
              storagePath: cert.storagePath ?? null,
              mediaStatus: cert.downloadURL
                ? ("ready" as const)
                : ("none" as const),
            }
          : {
              downloadURL: null,
              thumbURL: null,
              storagePath: null,
              mediaStatus: "pending" as const,
            };
        return {
          id: cert.id || `cert-${Date.now()}-${index}`,
          type: cert.type,
          title: cert.title || cert.type,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          expiryDateIso: expiry.toISOString(),
          hasAttachment: Boolean(newLocal || cert.downloadURL),
          localUri: newLocal,
          ...keepRemote,
        };
      });

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
        certificates: certPayload,
        localUri: newLocalPhoto,
      };

      const savedId = isEdit
        ? (
            await updateCrewMember({
              id: memberId,
              ...payload,
              clearPhoto,
            })
          ).id
        : (await addCrewMember(payload)).id;

      if (newLocalPhoto) {
        void uploadCrewMediaInBackground(savedId, newLocalPhoto);
      }
      for (const cert of certPayload) {
        if (cert.localUri && isLocalMediaUri(cert.localUri)) {
          void uploadCrewCertificateMediaInBackground(
            savedId,
            cert.id,
            cert.localUri
          );
        }
      }

      toast.success(
        isEdit ? t("crew.update-success") : t("crew.save-success")
      );
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
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => router.back()}
        />
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
              onPress={() => setMediaTarget({ kind: "photo" })}
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
          {certificates.map((cert, index) => {
            const certUri = pickDisplayMediaUri({
              thumbURL: cert.thumbURL,
              downloadURL: cert.downloadURL,
              localUri: cert.localUri,
            });
            return (
              <View key={cert.key} style={styles.certBlock}>
                <View style={styles.certHeader}>
                  <AppText style={styles.certBadge}>
                    {t("crew.certificate-n", { n: index + 1 })}
                  </AppText>
                  {certificates.length > 1 ? (
                    <Pressable
                      onPress={() =>
                        setCertificates((prev) =>
                          prev.filter((row) => row.key !== cert.key)
                        )
                      }
                    >
                      <AppText style={styles.removeLink}>
                        {t("crew.remove")}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>

                <SelectField
                  label={t("crew.certificate-type")}
                  value={cert.type}
                  placeholder={t("crew.certificate-type-placeholder")}
                  onPress={() => setCertTypeKey(cert.key)}
                />
                <Field
                  label={t("crew.cert-title")}
                  value={cert.title}
                  placeholder={t("crew.cert-title-placeholder")}
                  onChangeText={(text) => patchCert(cert.key, { title: text })}
                />
                <SelectField
                  label={t("crew.issue-date")}
                  value={cert.issueDate}
                  placeholder={t("safety.date-placeholder")}
                  onPress={() =>
                    setDateTarget({ certKey: cert.key, field: "issueDate" })
                  }
                />
                <SelectField
                  label={t("crew.expiry-date")}
                  value={cert.expiryDate}
                  placeholder={t("safety.date-placeholder")}
                  onPress={() =>
                    setDateTarget({ certKey: cert.key, field: "expiryDate" })
                  }
                />
                <UploadDropzone
                  title={
                    certUri ? t("crew.cert-file-added") : t("crew.upload-cert")
                  }
                  hint={t("crew.upload-cert-hint")}
                  icon="document-text-outline"
                  onPress={() =>
                    setMediaTarget({ kind: "certificate", certKey: cert.key })
                  }
                />
                {certUri ? (
                  <Pressable
                    onPress={() =>
                      patchCert(cert.key, {
                        localUri: null,
                        downloadURL: null,
                        thumbURL: null,
                        storagePath: null,
                        mediaStatus: "none",
                      })
                    }
                    style={styles.removePhoto}
                  >
                    <AppText style={styles.removePhotoText}>
                      {t("crew.remove-cert-file")}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          <Pressable
            onPress={() =>
              setCertificates((prev) => [...prev, createEmptyCertDraft()])
            }
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
        visible={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onImageSelected={(uri) => {
          if (mediaTarget?.kind === "photo") {
            setPhotoUri(uri);
          } else if (mediaTarget?.kind === "certificate") {
            patchCert(mediaTarget.certKey, {
              localUri: uri,
              mediaStatus: "pending",
            });
          }
          setMediaTarget(null);
        }}
      />

      <OptionsPickerModal
        visible={certTypeKey !== null}
        title={t("crew.certificate-type")}
        options={certOptions}
        selectedId={certOptions.find((o) => o.label === activeCertType)?.id}
        onClose={() => setCertTypeKey(null)}
        onSelect={(option) => {
          if (certTypeKey) {
            patchCert(certTypeKey, { type: option.label });
          }
          setCertTypeKey(null);
        }}
      />

      <DatePickerModal
        visible={dateTarget !== null}
        initialDate={parseSafetyDueDate(activeDateValue) ?? new Date()}
        onClose={() => setDateTarget(null)}
        onConfirm={(date) => {
          if (!dateTarget) return;
          patchCert(dateTarget.certKey, {
            [dateTarget.field]: formatSafetyDueDate(date),
          });
          setDateTarget(null);
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
    certBlock: {
      gap: 12,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
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
