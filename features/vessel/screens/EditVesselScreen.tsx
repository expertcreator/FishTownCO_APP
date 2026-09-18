import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { DEMO_VESSEL } from "@/features/common/data/demo";
import {
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/shared/components";
import { useTranslation } from "@/shared/translations";

/**
 * Edit Vessel screen matching prototype screen 18.
 * @returns Edit vessel form
 */
export default function EditVesselScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState(DEMO_VESSEL.name);
  const [type, setType] = useState(DEMO_VESSEL.type);
  const [length, setLength] = useState(DEMO_VESSEL.length);
  const [tonnage, setTonnage] = useState(DEMO_VESSEL.tonnage);
  const [flag, setFlag] = useState(DEMO_VESSEL.flag);
  const [mmsi, setMmsi] = useState(DEMO_VESSEL.mmsi);
  const [callSign, setCallSign] = useState(DEMO_VESSEL.callSign);
  const [homePort, setHomePort] = useState(DEMO_VESSEL.homePort);

  return (
    <Screen>
      <BackHeader
        title={t("vessel.edit-title")}
        subtitle={t("vessel.edit-subtitle")}
      />
      <Card style={styles.card}>
        <Field
          label={t("setup.vessel-name")}
          icon="boat-outline"
          value={name}
          onChangeText={setName}
        />
        <Field
          label={t("setup.vessel-type")}
          icon="compass-outline"
          value={type}
          onChangeText={setType}
        />
        <Field
          label={t("setup.length")}
          value={length}
          onChangeText={setLength}
        />
        <Field
          label={t("vessel.tonnage")}
          value={tonnage}
          onChangeText={setTonnage}
        />
        <Field label={t("vessel.flag")} value={flag} onChangeText={setFlag} />
        <Field
          label={t("setup.mmsi")}
          value={mmsi}
          onChangeText={setMmsi}
          keyboardType="number-pad"
        />
        <Field
          label={t("vessel.call-sign")}
          value={callSign}
          onChangeText={setCallSign}
        />
        <Field
          label={t("setup.home-port")}
          icon="location-outline"
          value={homePort}
          onChangeText={setHomePort}
        />
        <PrimaryButton
          label={t("common.save")}
          icon="checkmark"
          onPress={() => router.back()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
