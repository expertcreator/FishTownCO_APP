import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

const TILE_HEIGHT = 120;

type UploadTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  imageUri?: string | null;
  onPress: () => void;
  onRemove?: () => void;
};

type CertificatePhotoUploadProps = {
  certificateTitle: string;
  certificateHint: string;
  photoTitle: string;
  photoHint: string;
  certificateUri?: string | null;
  photoUri?: string | null;
  onAddCertificate: () => void;
  onAddPhoto: () => void;
  onRemoveCertificate?: () => void;
  onRemovePhoto?: () => void;
};

/**
 * Two-column certificate / photo upload tiles matching prototype screen 16.
 * Shows a local preview when an image URI is set (Storage upload comes later).
 * @param props - Upload tile props
 * @param props.certificateTitle - Certificate tile title
 * @param props.certificateHint - Certificate tile hint
 * @param props.photoTitle - Photo tile title
 * @param props.photoHint - Photo tile hint
 * @param props.certificateUri - Optional local certificate image URI
 * @param props.photoUri - Optional local photo image URI
 * @param props.onAddCertificate - Certificate tile press handler
 * @param props.onAddPhoto - Photo tile press handler
 * @param props.onRemoveCertificate - Clears the certificate preview
 * @param props.onRemovePhoto - Clears the photo preview
 * @returns Certificate and photo upload row
 */
export function CertificatePhotoUpload({
  certificateTitle,
  certificateHint,
  photoTitle,
  photoHint,
  certificateUri,
  photoUri,
  onAddCertificate,
  onAddPhoto,
  onRemoveCertificate,
  onRemovePhoto,
}: CertificatePhotoUploadProps) {
  return (
    <View style={styles.row}>
      <UploadTile
        icon="document-text-outline"
        title={certificateTitle}
        hint={certificateHint}
        imageUri={certificateUri}
        onPress={onAddCertificate}
        onRemove={onRemoveCertificate}
      />
      <UploadTile
        icon="camera-outline"
        title={photoTitle}
        hint={photoHint}
        imageUri={photoUri}
        onPress={onAddPhoto}
        onRemove={onRemovePhoto}
      />
    </View>
  );
}

/**
 * Single dashed upload tile used in the certificates grid.
 * Empty and filled states share the same width/height.
 * @param props - Tile props
 * @param props.icon - Leading icon
 * @param props.title - Primary label
 * @param props.hint - Secondary hint
 * @param props.imageUri - Optional preview image URI
 * @param props.onPress - Press handler
 * @param props.onRemove - Optional remove-preview handler
 * @returns Upload tile element
 */
function UploadTile({
  icon,
  title,
  hint,
  imageUri,
  onPress,
  onRemove,
}: UploadTileProps) {
  const colors = useColors();
  const styles = getTileStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={
        imageUri ? undefined : { color: "rgba(33,127,129,0.12)" }
      }
      style={({ pressed }) => [
        styles.tile,
        imageUri ? styles.previewTile : null,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {imageUri ? (
        <>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          {onRemove ? (
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              style={styles.removeBtn}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={22} color={colors.teal} />
          </View>
          <AppText style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          <AppText style={styles.hint} numberOfLines={1}>
            {hint}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
});

/**
 * Builds upload-tile styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getTileStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      height: TILE_HEIGHT,
      minHeight: TILE_HEIGHT,
      maxHeight: TILE_HEIGHT,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.teal,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    previewTile: {
      paddingVertical: 0,
      paddingHorizontal: 0,
      borderStyle: "solid",
    },
    previewImage: {
      ...StyleSheet.absoluteFill,
      width: undefined,
      height: undefined,
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.softTeal,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    title: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    hint: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 2,
      textAlign: "center",
    },
    pressed: { opacity: 0.88 },
  });
}
