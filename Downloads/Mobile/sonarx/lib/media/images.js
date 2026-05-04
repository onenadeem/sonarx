import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { encode } from "blurhash";

const IMAGE_MEDIA_TYPE = ImagePicker.MediaTypeOptions.Images;
const IMAGE_PERMISSION_ERROR = {
  library: "Media library permission denied",
  camera: "Camera permission denied",
};
const DEFAULT_MEDIA_OPTIONS = {
  mediaTypes: IMAGE_MEDIA_TYPE,
  quality: 1,
};

async function ensureMediaPermission(
  requestPermission,
  permissionErrorMessage,
) {
  const { status } = await requestPermission();
  if (status !== "granted") {
    throw new Error(permissionErrorMessage);
  }
}

async function launchImagePicker(launchFn, options = {}) {
  return launchFn({ ...DEFAULT_MEDIA_OPTIONS, ...options });
}

export async function compressImage(uri, maxWidth = 1920, quality = 0.8) {
  const { width, height } = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = uri;
  });
  let newWidth = width;
  let newHeight = height;
  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round((height * maxWidth) / width);
  }
  const compress = Math.round(quality * 100) / 100;
  const compressed = await manipulateAsync(
    uri,
    [{ resize: { width: newWidth, height: newHeight } }],
    { compress: compress, format: SaveFormat.JPEG },
  );
  const blurHash = await generateBlurHash(compressed.uri);
  return {
    uri: compressed.uri,
    width: newWidth,
    height: newHeight,
    size: compressed.height * compressed.width * 3,
    blurHash,
  };
}
export async function generateBlurHash(uri) {
  try {
    const small = await manipulateAsync(
      uri,
      [{ resize: { width: 32, height: 32 } }],
      { format: SaveFormat.PNG },
    );
    const response = await fetch(small.uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return encode(uint8Array, 32, 32, 4, 4);
  } catch {
    return "LEHV6nWB2yk8pyo0adR*.7kCMdnj";
  }
}
export async function createThumbnail(uri, size = 300) {
  const thumbnail = await manipulateAsync(
    uri,
    [{ resize: { width: size, height: size } }],
    { format: SaveFormat.JPEG, compress: 0.6 },
  );
  return thumbnail.uri;
}
export async function pickImage() {
  await ensureMediaPermission(
    ImagePicker.requestMediaLibraryPermissionsAsync,
    IMAGE_PERMISSION_ERROR.library,
  );
  return launchImagePicker(ImagePicker.launchImageLibraryAsync, {
    allowsEditing: false,
    allowsMultipleSelection: false,
  });
}
export async function takePhoto() {
  await ensureMediaPermission(
    ImagePicker.requestCameraPermissionsAsync,
    IMAGE_PERMISSION_ERROR.camera,
  );
  return launchImagePicker(ImagePicker.launchCameraAsync, {
    allowsEditing: false,
  });
}
export async function saveToGallery(uri) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission denied");
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}
