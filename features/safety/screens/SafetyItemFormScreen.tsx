import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  isLocalMediaUri,
  pickDisplayMediaUri,
} from "@/features/common/media/mediaStatus";
import { addSafetyItem } from "@/features/safety/services/addSafetyItem";
import { fetchSafetyItem } from "@/features/safety/services/fetchSafetyItem";
import { getCurrentLocationLabel } from "@/features/safety/services/getCurrentLocationLabel";
import { updateSafetyItem } from "@/features/safety/services/updateSafetyItem";
import { uploadSafetyMediaInBackground } from "@/features/safety/services/uploadSafetyMediaInBackground";
import { useLocationPickerStore } from "@/features/safety/store/locationPickerStore";
import { useSafetyCategoriesStore } from "@/features/safety/store/safetyCategoriesStore";
import {
  formatSafetyDueDate,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  createAddSafetySchema,
  type AddSafetySchema,
} from "@/features/safety/validation/addSafetySchema";
import {
  AppText,
  BackHeader,
  DatePickerModal,
  DocumentUploadField,
  FormCard,
  FormField,
  FormScreenSkeleton,
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
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type DateFieldKey = "lastServiceDate" | "nextDueDate" | "expiryDate";
type MediaTarget = "certificate" | "photo";

const EMPTY_FORM: AddSafetySchema = {
  itemType: "",
  name: "",
  makeModel: "",
  serial: "",
  locationAboard: "",
  lastServiceDate: "",
  nextDueDate: "",
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
 * Shared Add / Edit Safety Item form matching prototype screen 16.
 * - `/safety/add` → create
 * - `/safety/edit/[id]` → update existing Firestore item
 * @returns Safety item form screen
 */
export default function SafetyItemFormScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useColors();
  const styles = getStyles(colors);
  const schema = useMemo(() => createAddSafetySchema(t), [t]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const itemId = typeof id === "string" && id.length > 0 ? id : "";
  const isEdit = Boolean(itemId);

  const categories = useSafetyCategoriesStore((s) => s.categories);
  const categoriesLoading = useSafetyCategoriesStore((s) => s.isLoading);
  const loadCategories = useSafetyCategoriesStore((s) => s.loadCategories);

  const {
    data: item,
    isLoading: isItemLoading,
    isFetching: isItemFetching,
    isError: isItemError,
  } = useQuery({
    queryKey: ["safety", "item", itemId],
    enabled: isEdit,
    queryFn: () => fetchSafetyItem(itemId),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateFieldKey | null>(
    null
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<MediaTarget | null>(null);
  const [certificateUri, setCertificateUri] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState("");
  const [certificateMime, setCertificateMime] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const leftForMapRef = useRef(false);

  const { control, handleSubmit, setValue, watch, reset, formState } =
    useForm<AddSafetySchema>({
      resolver: zodResolver(schema),
      defaultValues: EMPTY_FORM,
      mode: "onChange",
      reValidateMode: "onChange",
    });

  const itemType = watch("itemType");
  const lastServiceDate = watch("lastServiceDate") ?? "";
  const nextDueDate = watch("nextDueDate");
  const expiryDate = watch("expiryDate") ?? "";

  const footerError =
    submitAttempted && Object.keys(formState.errors).length > 0
      ? t("safety.form-error")
      : null;

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      const picked = useLocationPickerStore.getState().consumeResult();
      if (picked) {
        leftForMapRef.current = false;
        setValue("locationAboard", picked.label, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setCoords({
          latitude: picked.latitude,
          longitude: picked.longitude,
        });
        return;
      }

      // Returning from the map without confirming must keep the draft form.
      if (leftForMapRef.current) {
        leftForMapRef.current = false;
        return;
      }

      if (isEdit) return;
      reset(EMPTY_FORM);
      setIsSubmitting(false);
      setActiveDateField(null);
      setSubmitAttempted(false);
      setPickerTarget(null);
      setCertificateUri(null);
      setCertificateName("");
      setCertificateMime("");
      setPhotoUri(null);
      setCoords(null);
      setHydrated(false);
    }, [isEdit, reset, setValue])
  );

  useEffect(() => {
    if (!isEdit || !item || hydrated) return;
    reset({
      itemType: item.category || "",
      name: item.name || "",
      makeModel: item.makeModel || "",
      serial: item.serial || "",
      locationAboard: item.location || "",
      lastServiceDate: toFormDate(item.lastServiceDate),
      nextDueDate: toFormDate(item.dueDateIso) || toFormDate(item.dueDate) || "",
      expiryDate: toFormDate(item.expiryDate),
    });
    if (
      typeof item.latitude === "number" &&
      typeof item.longitude === "number" &&
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude)
    ) {
      setCoords({ latitude: item.latitude, longitude: item.longitude });
    } else {
      setCoords(null);
    }
    setPhotoUri(
      pickDisplayMediaUri({
        thumbURL: item.photoThumbURL,
        downloadURL: item.photoDownloadURL,
        localUri: item.photoLocalUri,
      })
    );
    setCertificateUri(
      pickDisplayMediaUri({
        thumbURL: item.certThumbURL,
        downloadURL: item.certDownloadURL,
        localUri: item.certLocalUri,
      })
    );
    setCertificateName("");
    setCertificateMime(item.certThumbURL ? "image/jpeg" : "");
    setHydrated(true);
  }, [isEdit, item, hydrated, reset]);

  /**
   * Opens ITEM TYPE sheet using categories from Firestore.
   * @returns Promise that resolves when the sheet can open
   */
  const openCategoryPicker = async () => {
    setCategoryOpen(true);
    if (categories.length === 0) {
      await loadCategories();
    }
  };

  /**
   * Fills LOCATION ABOARD from device GPS (Expo reverse geocode).
   * @returns Promise that resolves when location is applied or a toast is shown
   */
  const onUseCurrentLocation = async () => {
    if (locationLoading) return;
    setLocationLoading(true);
    try {
      const result = await getCurrentLocationLabel();
      setValue("locationAboard", result.label, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setCoords({
        latitude: result.latitude,
        longitude: result.longitude,
      });
      toast.success(t("safety.location-updated"));
    } catch (error) {

      const code = error instanceof Error ? error.message : "LOCATION_FAILED";
      toast.error(
        code === "LOCATION_PERMISSION_DENIED"
          ? t("safety.location-permission-denied")
          : t("safety.location-failed")
      );
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Opens the Google Map location picker with the current coords when available.
   * @returns void
   */
  const onOpenMapPicker = () => {
    leftForMapRef.current = true;
    router.push({
      pathname: "/safety/pick-location",
      params: {
        latitude:
          coords?.latitude != null ? String(coords.latitude) : undefined,
        longitude:
          coords?.longitude != null ? String(coords.longitude) : undefined,
      },
    });
  };

  /**
   * Creates or updates the safety item in Firestore, kicks off background
   * media uploads, then navigates back without waiting for Storage.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: AddSafetySchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const due = parseSafetyDueDate(values.nextDueDate) ?? new Date();
      const newPhoto = isLocalMediaUri(photoUri) ? photoUri : null;
      const newCert = isLocalMediaUri(certificateUri) ? certificateUri : null;
      const hadPhoto = Boolean(
        item?.photoDownloadURL || item?.photoThumbURL || item?.photoLocalUri
      );
      const hadCert = Boolean(
        item?.certDownloadURL || item?.certThumbURL || item?.certLocalUri
      );
      const clearPhoto = isEdit && !photoUri && hadPhoto;
      const clearCertificate = isEdit && !certificateUri && hadCert;

      const payload = {
        itemType: values.itemType,
        name: values.name,
        makeModel: values.makeModel,
        serial: values.serial,
        locationAboard: values.locationAboard,
        lastServiceDate: values.lastServiceDate,
        nextDueDate: values.nextDueDate,
        nextDueDateIso: due.toISOString(),
        expiryDate: values.expiryDate,
        latitude: coords?.latitude ?? item?.latitude ?? null,
        longitude: coords?.longitude ?? item?.longitude ?? null,
        photoLocalUri: newPhoto,
        certLocalUri: newCert,
      };

      if (isEdit) {
        await updateSafetyItem({
          id: itemId,
          ...payload,
          clearPhoto,
          clearCertificate,
        });
        if (newPhoto) {
          void uploadSafetyMediaInBackground(itemId, "photo", newPhoto);
        }
        if (newCert) {
          void uploadSafetyMediaInBackground(itemId, "certificate", newCert, {
            fileName: certificateName,
            mimeType: certificateMime,
          });
        }
        toast.success(t("safety.update-success"));
      } else {
        const { id } = await addSafetyItem(payload);
        if (newPhoto) {
          void uploadSafetyMediaInBackground(id, "photo", newPhoto);
        }
        if (newCert) {
          void uploadSafetyMediaInBackground(id, "certificate", newCert, {
            fileName: certificateName,
            mimeType: certificateMime,
          });
        }
        toast.success(t("safety.add-success"));
      }
      router.back();
    } catch (error) {

      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("safety.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  const dateFieldValue =
    activeDateField === "lastServiceDate"
      ? lastServiceDate
      : activeDateField === "expiryDate"
        ? expiryDate
        : nextDueDate;

  if (
    (!isEdit && categoriesLoading && categories.length === 0) ||
    (isEdit &&
      (!item || !hydrated) &&
      (isItemLoading || isItemFetching || !isItemError))
  ) {
    return (
      <Screen
        scroll={false}
        contentStyle={styles.screenContent}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerPad}>
          <BackHeader
            title={isEdit ? t("safety.edit-title") : t("safety.add-title")}
          />
        </View>
        <FormScreenSkeleton />
      </Screen>
    );
  }

  if (isEdit && (isItemError || !item)) {
    return (
      <Screen
        scroll={false}
        contentStyle={styles.screenContent}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerPad}>
          <BackHeader title={t("safety.edit-title")} />
        </View>
        <AppText style={styles.empty}>{t("safety.item-missing")}</AppText>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screenContent}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerPad}>
        <BackHeader
          title={isEdit ? t("safety.edit-title") : t("safety.add-title")}
        />
      </View>

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <FormCard>
          <FormSelectField
            control={control}
            name="itemType"
            label={t("safety.item-type")}
            placeholder={t("safety.category-placeholder")}
            onPress={openCategoryPicker}
          />

          <FormField
            control={control}
            name="name"
            label={t("safety.item-name")}
            placeholder={t("safety.item-name-placeholder")}
          />

          <FormField
            control={control}
            name="makeModel"
            label={t("safety.make-model")}
            placeholder={t("safety.make-model-placeholder")}
          />

          <FormField
            control={control}
            name="serial"
            label={t("safety.serial")}
            placeholder={t("safety.serial-placeholder")}
          />

          <FormField
            control={control}
            name="locationAboard"
            label={t("safety.location-aboard")}
            placeholder={t("safety.location-aboard-placeholder")}
            trailingActions={[
              {
                icon: "locate-outline",
                accessibilityLabel: t("safety.use-current-location"),
                loading: locationLoading,
                onPress: onUseCurrentLocation,
              },
              {
                icon: "map-outline",
                accessibilityLabel: t("safety.open-map"),
                disabled: locationLoading,
                onPress: onOpenMapPicker,
              },
            ]}
          />

          <FormSelectField
            control={control}
            name="lastServiceDate"
            label={t("safety.last-service-date")}
            placeholder={t("safety.date-placeholder")}
            trailingIcon="calendar-outline"
            onPress={() => setActiveDateField("lastServiceDate")}
          />

          <FormSelectField
            control={control}
            name="nextDueDate"
            label={t("safety.next-due-date")}
            placeholder={t("safety.date-placeholder")}
            trailingIcon="calendar-outline"
            onPress={() => setActiveDateField("nextDueDate")}
          />

          <FormSelectField
            control={control}
            name="expiryDate"
            label={t("safety.expiry-date")}
            labelHint={t("safety.expiry-date-hint")}
            placeholder={t("safety.date-placeholder")}
            trailingIcon="calendar-outline"
            onPress={() => setActiveDateField("expiryDate")}
          />
        </FormCard>

        <FormCard>
          <SectionHeader title={t("safety.certificates-photos")} />
          <DocumentUploadField
            uri={certificateUri}
            fileName={certificateName}
            mimeType={certificateMime}
            emptyLabel={t("crew.upload-cert")}
            filledLabel={t("safety.file-on-file")}
            removeAccessibilityLabel={t("crew.remove-cert-file")}
            onChange={(file) => {
              setCertificateUri(file?.uri ?? null);
              setCertificateName(file?.name ?? "");
              setCertificateMime(file?.mimeType ?? "");
            }}
          />
          <UploadDropzone
            variant="photo"
            title={t("safety.add-photo")}
            hint={t("safety.add-photo-hint")}
            icon="camera-outline"
            imageUri={photoUri}
            onPress={() => setPickerTarget("photo")}
            onRemove={photoUri ? () => setPhotoUri(null) : undefined}
            removeAccessibilityLabel={t("crew.remove-photo")}
          />
        </FormCard>
      </KeyboardAwareContainer>

      <StickyFormFooter error={footerError}>
        <PrimaryButton
          label={isEdit ? t("safety.update-item") : t("safety.save-item")}
          icon="save-outline"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit, () => setSubmitAttempted(true))}
        />
      </StickyFormFooter>

      <ImagePickerSheet
        visible={pickerTarget === "photo"}
        onClose={() => setPickerTarget(null)}
        onImageSelected={(uri) => {
          setPhotoUri(uri);
          setPickerTarget(null);
        }}
      />

      <OptionsPickerModal
        visible={categoryOpen}
        title={t("safety.select-category")}
        options={categories}
        selectedId={categories.find((c) => c.label === itemType)?.id}
        loading={categoriesLoading && categories.length === 0}
        onClose={() => setCategoryOpen(false)}
        onSelect={(option) => {
          setValue("itemType", option.label, {
            shouldValidate: true,
            shouldDirty: true,
          });
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
 * Builds shared form-screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screenContent: {
      paddingHorizontal: 0,
      paddingBottom: 0,
      flex: 1,
    },
    headerPad: {
      paddingHorizontal: 20,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 14,
    },
    loader: { marginTop: 40 },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginTop: 32,
      paddingHorizontal: 20,
    },
  });
}
