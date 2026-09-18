import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import {
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/shared/components";
import { useTranslation } from "@/shared/translations";

/**
 * Add Safety Item screen matching prototype screen 16.
 * @returns Add safety item form
 */
export default function AddSafetyItemScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [serial, setSerial] = useState("");

  return (
    <Screen>
      <BackHeader
        title={t("safety.add-title")}
        subtitle={t("safety.add-subtitle")}
      />
      <Card style={styles.card}>
        <Field
          label={t("safety.item-name")}
          icon="shield-outline"
          value={name}
          onChangeText={setName}
          placeholder="Liferaft 8-Person"
        />
        <Field
          label={t("safety.category")}
          icon="grid-outline"
          value={category}
          onChangeText={setCategory}
          placeholder="Life-saving"
        />
        <Field
          label={t("safety.location")}
          icon="location-outline"
          value={location}
          onChangeText={setLocation}
          placeholder="Wheelhouse roof"
        />
        <Field
          label={t("safety.due-date")}
          icon="calendar-outline"
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="12 Apr 2026"
        />
        <Field
          label={t("safety.serial")}
          icon="barcode-outline"
          value={serial}
          onChangeText={setSerial}
          placeholder="LR-8-44291"
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
