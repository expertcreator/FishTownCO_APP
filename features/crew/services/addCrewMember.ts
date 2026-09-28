import {
  addDoc,
  collection,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { CREW_MEMBERS_QUERY_KEY } from "@/features/crew/hooks/useCrewMembers";

import type { MediaStatus } from "@/features/common/media/mediaStatus";

export type CrewCertificateInput = {
  id?: string;
  type: string;
  title?: string;
  issueDate?: string;
  expiryDate: string;
  expiryDateIso: string;
  hasAttachment?: boolean;
  localUri?: string | null;
  downloadURL?: string | null;
  thumbURL?: string | null;
  storagePath?: string | null;
  mediaStatus?: MediaStatus;
};

export type AddCrewMemberInput = {
  name: string;
  role: string;
  phone: string;
  email: string;
  certificates: CrewCertificateInput[];
  /** Local photo URI; uploaded in the background after create. */
  localUri?: string | null;
};

export type AddCrewMemberResult = {
  id: string;
  path: string;
};

/**
 * Creates a crew member under `users/{uid}/crew`.
 * @param input - Crew fields matching the Add Crew form
 * @returns Created document id and console path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function addCrewMember(
  input: AddCrewMemberInput
): Promise<AddCrewMemberResult> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const crewCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "crew"
  );
  const consolePath = `users/${user.uid}/crew`;

  const certificates = input.certificates.map((cert, index) => {
    const hasLocal = Boolean(cert.localUri?.trim());
    const hasRemote = Boolean(cert.downloadURL?.trim());
    return {
      id: cert.id?.trim() || `cert-${Date.now()}-${index}`,
      type: cert.type.trim(),
      title: (cert.title?.trim() || cert.type).trim(),
      issueDate: cert.issueDate?.trim() || null,
      expiryDate: cert.expiryDate.trim(),
      expiryDateIso: cert.expiryDateIso,
      hasAttachment: Boolean(cert.hasAttachment || hasLocal || hasRemote),
      localUri: cert.localUri?.trim() || null,
      downloadURL: cert.downloadURL?.trim() || null,
      thumbURL: cert.thumbURL?.trim() || null,
      storagePath: cert.storagePath?.trim() || null,
      mediaStatus:
        cert.mediaStatus ??
        (hasLocal ? "pending" : hasRemote ? "ready" : "none"),
    };
  });

  const primaryExpiryIso =
    certificates
      .map((c) => c.expiryDateIso)
      .filter(Boolean)
      .sort()[0] ?? null;

  const hasLocal = Boolean(input.localUri?.trim());

  try {
    const ref = await addDoc(crewCollection, {
      name: input.name.trim(),
      role: input.role.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      certificates,
      primaryExpiryIso,
      localUri: input.localUri?.trim() || null,
      downloadURL: null,
      thumbURL: null,
      storagePath: null,
      mediaStatus: hasLocal ? "pending" : "none",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const fullPath = `${consolePath}/${ref.id}`;

    await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });

    return { id: ref.id, path: fullPath };
  } catch (error) {

    throw error;
  }
}
