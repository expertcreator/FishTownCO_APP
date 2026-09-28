import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { isLocalMediaUri } from "@/features/common/media/mediaStatus";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { saveVesselProfile } from "@/features/vessel/services/saveVesselProfile";
import { uploadVesselDocument } from "@/features/vessel/services/uploadVesselDocument";
import { useVesselTypesStore } from "@/features/vessel/store/vesselTypesStore";
import { useVesselUsesStore } from "@/features/vessel/store/vesselUsesStore";
import {
  createEditVesselSchema,
  type EditVesselSchema,
} from "@/features/vessel/validation/vesselSchema";
import {
  AppText,
  BackHeader,
  FormCard,
  FormField,
  FormScreenSkeleton,
  DocumentUploadField,
  FormSelectField,
  KeyboardAwareContainer,
  OptionsPickerModal,
  PrimaryButton,
  Screen,
  StickyFormFooter,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Edit Vessel screen matching https://fishtownco.itoasis.co/ (prototype screen 18).
 * Loads and saves `users/{uid}/vessel/profile` in Firestore.
 * Dismisses the keyboard when the form is scrolled (same as Add Safety Item).
 * @returns Edit vessel form
 */
export default function EditVesselScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useColors();
  const styles = getStyles(colors);
  const schema = useMemo(() => createEditVesselSchema(t), [t]);
  const {
    data: vessel,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useVesselProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentMime, setDocumentMime] = useState("");
  const vesselTypes = useVesselTypesStore((state) => state.types);
  const typesLoading = useVesselTypesStore((state) => state.isLoading);
  const loadTypes = useVesselTypesStore((state) => state.loadTypes);
  const vesselUses = useVesselUsesStore((state) => state.uses);
  const usesLoading = useVesselUsesStore((state) => state.isLoading);
  const loadUses = useVesselUsesStore((state) => state.loadUses);
  /** `undefined` until first fetch settles — never paint an empty form early. */
  const isInitialLoad = vessel === undefined;

  const { control, handleSubmit, reset, setValue, watch } = useForm<EditVesselSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      length: "",
      homePort: "",
      mmsi: "",
      registrationNo: "",
      engineHours: "",
      usage: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const vesselType = watch("type");
  const vesselUse = watch("usage");

  useEffect(() => {
    void loadTypes();
    void loadUses();
  }, [loadTypes, loadUses]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  useEffect(() => {
    // Wait for query settle (`null` = no profile, object = existing).
    if (vessel === undefined || hydrated) return;
    if (vessel) {
      reset({
        name: vessel.name,
        type: vessel.type,
        length: vessel.length,
        homePort: vessel.homePort,
        mmsi: vessel.mmsi,
        registrationNo: vessel.registrationNo,
        engineHours: vessel.engineHours,
        usage: vessel.usage,
      });
      setDocumentUri(vessel.documentUrl || null);
      setDocumentName(vessel.documentName || "");
      setDocumentMime("");
    }
    setHydrated(true);
  }, [vessel, hydrated, reset]);

  /**
   * Saves the vessel profile to Firestore and returns to My Vessel.
   * Preserves photo / next-service / checklist fields not shown on this form.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: EditVesselSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let nextDocumentUrl = documentUri;
      let nextDocumentName = documentName;
      let nextDocumentPath = vessel?.documentStoragePath ?? "";
      if (documentUri && isLocalMediaUri(documentUri)) {
        const uploaded = await uploadVesselDocument(
          documentUri,
          documentName,
          documentMime
        );
        nextDocumentUrl = uploaded.downloadURL;
        nextDocumentName = uploaded.fileName;
        nextDocumentPath = uploaded.storagePath;
      }

      await saveVesselProfile({
        name: values.name,
        type: values.type,
        length: values.length,
        homePort: values.homePort,
        mmsi: values.mmsi,
        registrationNo: values.registrationNo,
        engineHours: values.engineHours,
        usage: values.usage,
        documentUrl: nextDocumentUrl,
        documentName: nextDocumentName,
        documentStoragePath: nextDocumentPath,
        tonnage: vessel?.tonnage,
        flag: vessel?.flag,
        callSign: vessel?.callSign,
        yearBuilt: vessel?.yearBuilt,
        skipper: vessel?.skipper,
        nextServiceIn: vessel?.nextServiceIn,
        photoUrl: vessel?.photoUrl,
        photoThumbUrl: vessel?.photoThumbUrl,
      });
      toast.success(t("vessel.save-success"));
      router.back();
    } catch (error) {

      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("vessel.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  if (
    isInitialLoad &&
    (isLoading || isFetching || !isError)
  ) {
    return (
      <Screen>
        <View style={styles.headerPad}>
          <BackHeader title={t("vessel.edit-title")} />
        </View>
        <FormScreenSkeleton />
      </Screen>
    );
  }

  if (isInitialLoad && isError) {
    return (
      <Screen>
        <View style={styles.headerPad}>
          <BackHeader title={t("vessel.edit-title")} />
        </View>
        <AppText style={styles.hint}>{t("vessel.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => {
            setHydrated(false);
            void refetch();
          }}
        />
      </Screen>
    );
  }

  if (!hydrated) {
    return (
      <Screen>
        <View style={styles.headerPad}>
          <BackHeader title={t("vessel.edit-title")} />
        </View>
        <FormScreenSkeleton />
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
        <BackHeader title={t("vessel.edit-title")} />
      </View>

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <FormCard style={styles.card}>
          <FormField
            control={control}
            name="name"
            label={t("setup.vessel-name")}
            placeholder={t("vessel.name-placeholder")}
          />
          <FormSelectField
            control={control}
            name="type"
            label={t("setup.vessel-type")}
            placeholder={t("vessel.type-placeholder")}
            loading={typesLoading && vesselTypes.length === 0}
            onPress={() => {
              setTypeOpen(true);
              if (vesselTypes.length === 0) void loadTypes();
            }}
          />
          <FormField
            control={control}
            name="length"
            label={t("vessel.length-loa")}
            placeholder={t("vessel.length-placeholder")}
          />
          <FormField
            control={control}
            name="homePort"
            label={t("vessel.home-port-harbour")}
            placeholder={t("vessel.home-port-placeholder")}
          />
          <FormField
            control={control}
            name="mmsi"
            label={t("vessel.mmsi-number")}
            keyboardType="number-pad"
            placeholder={t("vessel.mmsi-placeholder")}
          />
          <FormField
            control={control}
            name="registrationNo"
            label={t("vessel.registration-no")}
            placeholder={t("vessel.registration-placeholder")}
          />
          <FormField
            control={control}
            name="engineHours"
            label={t("vessel.engine-hours")}
            keyboardType="number-pad"
            placeholder={t("vessel.engine-hours-placeholder")}
          />
          <FormSelectField
            control={control}
            name="usage"
            label={t("vessel.vessel-use")}
            placeholder={t("vessel.usage-placeholder")}
            loading={usesLoading && vesselUses.length === 0}
            onPress={() => {
              setUseOpen(true);
              if (vesselUses.length === 0) void loadUses();
            }}
          />
          <DocumentUploadField
            uri={documentUri}
            fileName={documentName}
            mimeType={documentMime}
            emptyLabel={t("vessel.upload-document")}
            filledLabel={t("vessel.document-added")}
            removeAccessibilityLabel={t("vessel.remove-document")}
            onChange={(file) => {
              setDocumentUri(file?.uri ?? null);
              setDocumentName(file?.name ?? "");
              setDocumentMime(file?.mimeType ?? "");
            }}
          />
        </FormCard>
      </KeyboardAwareContainer>

      <StickyFormFooter>
        <PrimaryButton
          label={t("vessel.save-profile")}
          icon="save-outline"
          iconPosition="leading"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </StickyFormFooter>

      <OptionsPickerModal
        visible={typeOpen}
        title={t("vessel.select-type")}
        options={vesselTypes}
        selectedId={vesselTypes.find((option) => option.label === vesselType)?.id}
        loading={typesLoading && vesselTypes.length === 0}
        onClose={() => setTypeOpen(false)}
        onSelect={(option) => {
          setValue("type", option.label, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      />

      <OptionsPickerModal
        visible={useOpen}
        title={t("vessel.select-use")}
        options={vesselUses}
        selectedId={vesselUses.find((option) => option.label === vesselUse)?.id}
        loading={usesLoading && vesselUses.length === 0}
        onClose={() => setUseOpen(false)}
        onSelect={(option) => {
          setValue("usage", option.label, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      />
    </Screen>
  );
}

/**
 * Builds edit-vessel styles matching the prototype header and form card.
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
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    card: {
      marginBottom: 12,
      gap: 14,
      padding: 20,
      borderRadius: 16,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
