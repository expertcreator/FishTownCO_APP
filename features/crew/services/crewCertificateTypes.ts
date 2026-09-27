import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "@react-native-firebase/firestore";
import { firebaseFirestore, getCurrentUser } from "@/features/common/firebase";
import { CREW_CERTIFICATE_TYPE_SEED } from "@/features/crew/data/crewCertificateTypeSeed";
import type { PickerOption } from "@/ui/components/OptionsPickerModal";

const COLLECTION = "crewCertificateTypes";

/**
 * Upserts seed certificate-type documents into Firestore `crewCertificateTypes`.
 * @returns Number of docs upserted
 * @throws {Error} When Firestore write fails
 */
export async function upsertCrewCertificateTypeSeed(): Promise<number> {
  const user = getCurrentUser();
  if (!user?.uid) {
    console.log("[upsertCrewCertificateTypeSeed] skipped — not signed in");
    return 0;
  }

  console.log("[upsertCrewCertificateTypeSeed] start");
  await Promise.all(
    CREW_CERTIFICATE_TYPE_SEED.map((item) =>
      setDoc(
        doc(firebaseFirestore, COLLECTION, item.id),
        {
          name: item.label,
          label: item.label,
          order: item.order,
        },
        { merge: true }
      )
    )
  );
  console.log("[upsertCrewCertificateTypeSeed] done", {
    count: CREW_CERTIFICATE_TYPE_SEED.length,
  });
  return CREW_CERTIFICATE_TYPE_SEED.length;
}

/**
 * Loads crew certificate types from Firestore only (no static UI fallback).
 * @returns Certificate type picker options
 * @throws {Error} When Firestore read fails
 */
export async function fetchCrewCertificateTypes(): Promise<PickerOption[]> {
  console.log("[fetchCrewCertificateTypes] start");
  const snapshot = await getDocs(collection(firebaseFirestore, COLLECTION));

  const options = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        name?: string;
        label?: string;
        order?: number;
      };
      return {
        id: docSnap.id,
        label: (data.name ?? data.label ?? docSnap.id).trim(),
        order: typeof data.order === "number" ? data.order : 999,
      };
    })
    .filter((o) => o.label.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label }) => ({ id, label }));

  console.log("[fetchCrewCertificateTypes] success", {
    count: options.length,
  });
  return options;
}
