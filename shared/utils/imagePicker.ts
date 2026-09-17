import * as ImagePicker from "expo-image-picker";

type MediaKind = "images" | "videos";

type PickerOptions = {
  from: "camera" | "gallery";
  multiple?: boolean;
  cropping?: boolean;
  width?: number;
  height?: number;
  mediaTypes?: MediaKind[];
};

export type PickedMedia = {
  uri: string;
  mimeType: string;
};

const VIDEO_EXT = new Set(["mp4", "mov", "m4v", "webm", "3gp", "avi"]);

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
  "3gp": "video/3gpp",
  avi: "video/x-msvideo",
};

const extensionOf = (uri: string): string =>
  uri.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";

export const mimeTypeFromUri = (
  uri: string,
  kind?: "image" | "video"
): string => {
  const mapped = MIME_BY_EXT[extensionOf(uri)];
  if (mapped) {
    return mapped;
  }
  return kind === "video" ? "video/mp4" : "image/jpeg";
};

export const isVideoUri = (uri: string): boolean =>
  VIDEO_EXT.has(extensionOf(uri)) || mimeTypeFromUri(uri).startsWith("video/");

const requestPermissions = async (
  from: "camera" | "gallery"
): Promise<boolean> => {
  if (from === "camera") {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    return cameraPermission.status === "granted";
  }
  const galleryPermission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  return galleryPermission.status === "granted";
};

const getBaseOptions = (
  options: PickerOptions
): ImagePicker.ImagePickerOptions => {
  const mediaTypes = options.mediaTypes ?? ["images"];
  const includesVideo = mediaTypes.includes("videos");
  return {
    mediaTypes,
    allowsMultipleSelection: false,
    allowsEditing: includesVideo ? false : (options.cropping ?? false),
    aspect: options.cropping
      ? [options.width ?? 1, options.height ?? 1]
      : undefined,
    quality: 0.8,
  };
};

const launchImagePicker = async (
  from: "camera" | "gallery",
  baseOptions: ImagePicker.ImagePickerOptions
): Promise<ImagePicker.ImagePickerResult> => {
  if (from === "camera") {
    return await ImagePicker.launchCameraAsync(baseOptions);
  }
  return await ImagePicker.launchImageLibraryAsync(baseOptions);
};

const mediaFromAsset = (
  asset: ImagePicker.ImagePickerAsset
): PickedMedia => {
  const kind = asset.type === "video" ? "video" : "image";
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || mimeTypeFromUri(asset.uri, kind),
  };
};

export const pickMedia = async (
  options: PickerOptions
): Promise<PickedMedia[]> => {
  try {
    const hasPermission = await requestPermissions(options.from);
    if (!hasPermission) {
      return [];
    }

    const result = await launchImagePicker(options.from, getBaseOptions(options));
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }
    return result.assets.map(mediaFromAsset);
  } catch {
    return [];
  }
};

export const pickImage = async (options: PickerOptions): Promise<string[]> => {
  const picked = await pickMedia(options);
  return picked.map((item) => item.uri);
};
