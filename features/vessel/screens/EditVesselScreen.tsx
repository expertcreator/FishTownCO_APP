import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet } from "react-native";
import { DEMO_VESSEL } from "@/features/common/data/demo";
import {
  BackHeader,
  Card,
  FormField,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import {
  createEditVesselSchema,
  type EditVesselSchema,
} from "@/features/vessel/validation/vesselSchema";

/**
 * Edit Vessel screen matching prototype screen 18.
 * @returns Edit vessel form
 */
export default function EditVesselScreen() {
  const { t } = useTranslation();
  const schema = useMemo(() => createEditVesselSchema(t), [t]);
  const { control, handleSubmit } = useForm<EditVesselSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: DEMO_VESSEL.name,
      type: DEMO_VESSEL.type,
      length: DEMO_VESSEL.length,
      tonnage: DEMO_VESSEL.tonnage,
      flag: DEMO_VESSEL.flag,
      mmsi: DEMO_VESSEL.mmsi,
      callSign: DEMO_VESSEL.callSign,
      homePort: DEMO_VESSEL.homePort,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <Screen>
      <BackHeader
        title={t("vessel.edit-title")}
        subtitle={t("vessel.edit-subtitle")}
      />
      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("setup.vessel-name")}
          icon="boat-outline"
        />
        <FormField
          control={control}
          name="type"
          label={t("setup.vessel-type")}
          icon="compass-outline"
        />
        <FormField
          control={control}
          name="length"
          label={t("setup.length")}
        />
        <FormField control={control} name="tonnage" label={t("vessel.tonnage")} />
        <FormField control={control} name="flag" label={t("vessel.flag")} />
        <FormField
          control={control}
          name="mmsi"
          label={t("setup.mmsi")}
          keyboardType="number-pad"
        />
        <FormField
          control={control}
          name="callSign"
          label={t("vessel.call-sign")}
        />
        <FormField
          control={control}
          name="homePort"
          label={t("setup.home-port")}
          icon="location-outline"
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
