import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import {
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Add Document screen matching prototype screen 17.
 * @returns Add document form
 */
export default function AddDocumentScreen() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [expires, setExpires] = useState("");
  const [code, setCode] = useState("");

  return (
    <Screen>
      <BackHeader
        title={t("wallet.add-doc-title")}
        subtitle={t("wallet.add-doc-subtitle")}
      />
      <Card style={styles.card}>
        <Field
          label={t("wallet.doc-title")}
          icon="document-text-outline"
          value={title}
          onChangeText={setTitle}
          placeholder="Safety Certificate"
        />
        <Field
          label={t("wallet.issuer")}
          icon="business-outline"
          value={issuer}
          onChangeText={setIssuer}
          placeholder="MCA"
        />
        <Field
          label={t("wallet.expires")}
          icon="calendar-outline"
          value={expires}
          onChangeText={setExpires}
          placeholder="22 Nov 2026"
        />
        <Field
          label={t("wallet.doc-code")}
          icon="key-outline"
          value={code}
          onChangeText={setCode}
          placeholder="SC-NS-2024"
        />
        <PrimaryButton
          label={t("wallet.upload-save")}
          icon="cloud-upload-outline"
          onPress={() => router.back()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
