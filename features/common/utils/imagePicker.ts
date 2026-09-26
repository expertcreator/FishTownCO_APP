import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

type PickerOptions = {
  from: "camera" | "gallery";
  cropping?: boolean;
  width?: number;
  height?: number;
};

/**
 * Requests camera permission when capturing a photo.
 * Gallery uses the system photo picker (no extra permission on modern Android/iOS).
 * @param from - Camera or gallery source
 * @returns Whether permission was granted (always true for gallery)
 */
async function requestPermissions(
  from: "camera" | "gallery"
): Promise<boolean> {
  try {
    if (from === "gallery") {
      return true;
    }
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    return cameraPermission.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Builds expo-image-picker options from app picker options.
 * @param options - App picker options
 * @returns Expo image picker options
 */
function getBaseOptions(
  options: PickerOptions
): ImagePicker.ImagePickerOptions {
  const baseOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: options.cropping ?? false,
    quality: 0.8,
    exif: false,
  };

  if (options.cropping && options.width && options.height) {
    const width = Math.max(1, Math.min(options.width, 10_000));
    const height = Math.max(1, Math.min(options.height, 10_000));
    baseOptions.aspect = [width, height];
  }

  return baseOptions;
}

/**
 * Launches the camera or gallery picker.
 * @param from - Camera or gallery source
 * @param baseOptions - Expo picker options
 * @returns Picker result (canceled on failure)
 */
async function launchImagePicker(
  from: "camera" | "gallery",
  baseOptions: ImagePicker.ImagePickerOptions
): Promise<ImagePicker.ImagePickerResult> {
  try {
    if (from === "camera") {
      if (Platform.OS === "ios") {
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        if (cameraStatus.status !== "granted") {
          return { canceled: true, assets: null };
        }
      }
      return await ImagePicker.launchCameraAsync(baseOptions);
    }

    return await ImagePicker.launchImageLibraryAsync(baseOptions);
  } catch {
    return { canceled: true, assets: null };
  }
}

/**
 * Extracts image URIs from a picker result.
 * @param result - Expo image picker result
 * @returns Non-empty image URI list
 */
function extractImageUris(result: ImagePicker.ImagePickerResult): string[] {
  try {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    return result.assets
      .filter((asset) => asset?.uri && typeof asset.uri === "string")
      .map((asset) => asset.uri);
  } catch {
    return [];
  }
}

/**
 * Picks one or more images from the camera or gallery (Foori-style helper).
 * Returns an empty array when cancelled or permission is denied.
 * @param options - Picker source and optional crop settings
 * @returns Selected image URI list
 */
export async function pickImage(options: PickerOptions): Promise<string[]> {
  try {
    if (!options || typeof options.from !== "string") {
      return [];
    }

    const hasPermission = await requestPermissions(options.from);
    if (!hasPermission) {
      return [];
    }

    const baseOptions = getBaseOptions(options);
    const result = await launchImagePicker(options.from, baseOptions);
    return extractImageUris(result);
  } catch {
    return [];
  }
}
