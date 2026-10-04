import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { isLocalMediaUri } from "@/features/common/media/mediaStatus";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { saveVesselProfile } from "@/features/vessel/services/saveVesselProfile";
import { uploadVesselPhoto } from "@/features/vessel/services/uploadVesselPhoto";
import { useVesselTypesStore } from "@/features/vessel/store/vesselTypesStore";
import {
  createVesselSetupSchema,
  type VesselSetupSchema,
} from "@/features/vessel/validation/vesselSchema";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  FormSelectField,
  ImagePickerSheet,
  OptionsPickerModal,
  PrimaryButton,
  Screen,
  UploadDropzone,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Vessel Setup screen matching prototype screen 8.
 * Saves the vessel profile to Firestore, then continues to the checklist.
 * @returns Vessel setup UI
 */
export default function VesselSetupScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const schema = useMemo(() => createVesselSetupSchema(t), [t]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const vesselTypes = useVesselTypesStore((state) => state.types);
  const typesLoading = useVesselTypesStore((state) => state.isLoading);
  const loadTypes = useVesselTypesStore((state) => state.loadTypes);
  const { data: vessel } = useVesselProfile();
  const [hydrated, setHydrated] = useState(false);
  const isEditing = Boolean(vessel?.name);

  const { control, handleSubmit, reset, setValue, watch } = useForm<VesselSetupSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      length: "",
      homePort: "",
      mmsi: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const vesselType = watch("type");

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    if (vessel === undefined || hydrated) return;
    if (vessel) {
      reset({
        name: vessel.name,
        type: vessel.type,
        length: vessel.length,
        homePort: vessel.homePort,
        mmsi: vessel.mmsi,
      });
      setPhotoUri(vessel.photoUrl || vessel.photoThumbUrl || null);
    }
    setHydrated(true);
  }, [vessel, hydrated, reset]);

  /**
   * Saves vessel basics to Firestore.
   * A new vessel continues to the checklist. An existing vessel returns to the previous screen.
   * @param values - Validated setup form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: VesselSetupSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let photoUrl = vessel?.photoUrl ?? "";
      let photoThumbUrl = vessel?.photoThumbUrl ?? "";
      if (!photoUri) {
        photoUrl = "";
        photoThumbUrl = "";
      } else if (isLocalMediaUri(photoUri)) {
        const uploaded = await uploadVesselPhoto(photoUri);
        photoUrl = uploaded.downloadURL;
        photoThumbUrl = uploaded.thumbURL;
      }

      await saveVesselProfile({
        name: values.name,
        type: values.type,
        length: values.length,
        homePort: values.homePort,
        mmsi: values.mmsi,
        photoUrl,
        photoThumbUrl,
        registrationNo: vessel?.registrationNo,
        engineHours: vessel?.engineHours,
        usage: vessel?.usage,
        tonnage: vessel?.tonnage,
        flag: vessel?.flag,
        callSign: vessel?.callSign,
        yearBuilt: vessel?.yearBuilt,
        skipper: vessel?.skipper,
        nextServiceIn: vessel?.nextServiceIn,
      });
      toast.success(t("vessel.save-success"));
      if (isEditing) {
        router.back();
      } else {
        router.push("/vessel/build-checklist");
      }
    } catch (error) {

      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("vessel.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      header={
        <BackHeader
          title={t("setup.vessel-title")}
          subtitle={t("setup.vessel-subtitle")}
        />
      }
    >
      <View style={styles.step}>
        <AppText style={styles.stepText}>{t("setup.step-1")}</AppText>
      </View>

      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("setup.vessel-name")}
          icon="boat-outline"
        />
        <FormSelectField
          control={control}
          name="type"
          label={t("setup.vessel-type")}
          placeholder={t("vessel.type-placeholder")}
          icon="compass-outline"
          loading={typesLoading && vesselTypes.length === 0}
          onPress={() => {
            setTypeOpen(true);
            if (vesselTypes.length === 0) void loadTypes();
          }}
        />
        <FormField
          control={control}
          name="length"
          label={t("setup.length")}
          icon="resize-outline"
        />
        <FormField
          control={control}
          name="homePort"
          label={t("setup.home-port")}
          icon="location-outline"
        />
        <FormField
          control={control}
          name="mmsi"
          label={t("setup.mmsi")}
          icon="radio-outline"
          keyboardType="number-pad"
        />
        <View style={styles.photoBlock}>
          <View style={styles.photoLabelRow}>
            <AppText style={styles.photoLabel}>{t("setup.vessel-photo")}</AppText>
            <AppText style={styles.photoOptional}>
              {t("setup.vessel-photo-optional")}
            </AppText>
          </View>
          <UploadDropzone
            variant="photo"
            title={
              photoUri ? t("vessel.photo-change") : t("vessel.photo-upload")
            }
            hint={t("vessel.photo-hint")}
            icon="camera-outline"
            imageUri={photoUri}
            onPress={() => setPhotoPickerOpen(true)}
            onRemove={photoUri ? () => setPhotoUri(null) : undefined}
            removeAccessibilityLabel={t("crew.remove-photo")}
          />
        </View>
        <PrimaryButton
          label={
            isEditing ? t("vessel.save-profile") : t("setup.continue-checklist")
          }
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </Card>

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

      <ImagePickerSheet
        visible={photoPickerOpen}
        onClose={() => setPhotoPickerOpen(false)}
        onImageSelected={(uri) => {
          setPhotoUri(uri);
          setPhotoPickerOpen(false);
        }}
      />
    </Screen>
  );
}

/**
 * Builds vessel-setup styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    step: {
      alignSelf: "flex-start",
      backgroundColor: colors.softTeal,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 14,
    },
    stepText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
    card: { gap: 14 },
    photoBlock: { gap: 8 },
    photoLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    photoLabel: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    photoOptional: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
