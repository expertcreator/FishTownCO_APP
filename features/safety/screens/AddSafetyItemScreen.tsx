import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet } from "react-native";
import {
  BackHeader,
  Card,
  FormField,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import {
  createAddSafetySchema,
  type AddSafetySchema,
} from "@/features/safety/validation/addSafetySchema";

/**
 * Add Safety Item screen matching prototype screen 16.
 * @returns Add safety item form
 */
export default function AddSafetyItemScreen() {
  const { t } = useTranslation();
  const schema = useMemo(() => createAddSafetySchema(t), [t]);
  const { control, handleSubmit } = useForm<AddSafetySchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      location: "",
      dueDate: "",
      serial: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <Screen>
      <BackHeader
        title={t("safety.add-title")}
        subtitle={t("safety.add-subtitle")}
      />
      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("safety.item-name")}
          icon="shield-outline"
          placeholder="Liferaft 8-Person"
        />
        <FormField
          control={control}
          name="category"
          label={t("safety.category")}
          icon="grid-outline"
          placeholder="Life-saving"
        />
        <FormField
          control={control}
          name="location"
          label={t("safety.location")}
          icon="location-outline"
          placeholder="Wheelhouse roof"
        />
        <FormField
          control={control}
          name="dueDate"
          label={t("safety.due-date")}
          icon="calendar-outline"
          placeholder="12 Apr 2026"
        />
        <FormField
          control={control}
          name="serial"
          label={t("safety.serial")}
          icon="barcode-outline"
          placeholder="LR-8-44291"
        />
        <PrimaryButton
          label={t("common.save")}
          icon="checkmark"
          onPress={handleSubmit(() => router.back())}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
