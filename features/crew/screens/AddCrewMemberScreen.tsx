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
  createAddCrewSchema,
  type AddCrewSchema,
} from "@/features/crew/validation/addCrewSchema";

/**
 * Add Crew Member screen matching prototype screen 20.
 * @returns Add crew form
 */
export default function AddCrewMemberScreen() {
  const { t } = useTranslation();
  const schema = useMemo(() => createAddCrewSchema(t), [t]);
  const { control, handleSubmit } = useForm<AddCrewSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      role: "",
      cert: "",
      expires: "",
      phone: "",
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <Screen>
      <BackHeader
        title={t("crew.add-title")}
        subtitle={t("crew.add-subtitle")}
      />
      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("auth.full-name")}
          icon="person-outline"
          placeholder="Emma Clarke"
        />
        <FormField
          control={control}
          name="role"
          label={t("crew.role")}
          icon="briefcase-outline"
          placeholder="Deckhand"
        />
        <FormField
          control={control}
          name="cert"
          label={t("crew.certificate")}
          icon="medal-outline"
          placeholder="STCW Basic Safety"
        />
        <FormField
          control={control}
          name="expires"
          label={t("crew.expires")}
          icon="calendar-outline"
          placeholder="02 Feb 2026"
        />
        <FormField
          control={control}
          name="phone"
          label={t("crew.phone")}
          icon="call-outline"
          keyboardType="phone-pad"
          placeholder="+44 7700 900456"
        />
        <FormField
          control={control}
          name="email"
          label={t("auth.email-address")}
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="emma@northernstar.co.uk"
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
