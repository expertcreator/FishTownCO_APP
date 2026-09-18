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
  createAddDocumentSchema,
  type AddDocumentSchema,
} from "@/features/wallet/validation/addDocumentSchema";

/**
 * Add Document screen matching prototype screen 17.
 * @returns Add document form
 */
export default function AddDocumentScreen() {
  const { t } = useTranslation();
  const schema = useMemo(() => createAddDocumentSchema(t), [t]);
  const { control, handleSubmit } = useForm<AddDocumentSchema>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", issuer: "", expires: "", code: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <Screen>
      <BackHeader
        title={t("wallet.add-doc-title")}
        subtitle={t("wallet.add-doc-subtitle")}
      />
      <Card style={styles.card}>
        <FormField
          control={control}
          name="title"
          label={t("wallet.doc-title")}
          icon="document-text-outline"
          placeholder="Safety Certificate"
        />
        <FormField
          control={control}
          name="issuer"
          label={t("wallet.issuer")}
          icon="business-outline"
          placeholder="MCA"
        />
        <FormField
          control={control}
          name="expires"
          label={t("wallet.expires")}
          icon="calendar-outline"
          placeholder="22 Nov 2026"
        />
        <FormField
          control={control}
          name="code"
          label={t("wallet.doc-code")}
          icon="key-outline"
          placeholder="SC-NS-2024"
        />
        <PrimaryButton
          label={t("wallet.upload-save")}
          icon="cloud-upload-outline"
          onPress={handleSubmit(() => router.back())}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
