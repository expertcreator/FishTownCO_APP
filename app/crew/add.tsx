import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import {
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * Add Crew Member screen matching prototype screen 20.
 * @returns Add crew form
 */
export default function AddCrewMemberScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [cert, setCert] = useState("");
  const [expires, setExpires] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Screen>
      <BackHeader
        title={t("crew.add-title")}
        subtitle={t("crew.add-subtitle")}
      />
      <Card style={styles.card}>
        <Field
          label={t("auth.full-name")}
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="Emma Clarke"
        />
        <Field
          label={t("crew.role")}
          icon="briefcase-outline"
          value={role}
          onChangeText={setRole}
          placeholder="Deckhand"
        />
        <Field
          label={t("crew.certificate")}
          icon="medal-outline"
          value={cert}
          onChangeText={setCert}
          placeholder="STCW Basic Safety"
        />
        <Field
          label={t("crew.expires")}
          icon="calendar-outline"
          value={expires}
          onChangeText={setExpires}
          placeholder="02 Feb 2026"
        />
        <Field
          label={t("crew.phone")}
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+44 7700 900456"
        />
        <Field
          label={t("auth.email-address")}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="emma@northernstar.co.uk"
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
