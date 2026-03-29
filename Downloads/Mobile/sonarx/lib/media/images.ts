import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { encode } from "blurhash";

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
  blurHash: string;
  thumbnailUri?: string;
}

export async function compressImage(
  uri: string,
  maxWidth: number = 1920,
  quality: number = 0.8,
): Promise<ProcessedImage> {
  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve) => {
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

export async function generateBlurHash(uri: string): Promise<string> {
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

export async function createThumbnail(
  uri: string,
  size: number = 300,
): Promise<string> {
  const thumbnail = await manipulateAsync(
    uri,
    [{ resize: { width: size, height: size } }],
    { format: SaveFormat.JPEG, compress: 0.6 },
  );
  return thumbnail.uri;
}

export async function pickImage(): Promise<ImagePicker.ImagePickerResult> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission denied");
  }

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 1,
  });
}

export async function takePhoto(): Promise<ImagePicker.ImagePickerResult> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Camera permission denied");
  }

  return ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });
}

export async function saveToGallery(uri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission denied");
  }

  await MediaLibrary.saveToLibraryAsync(uri);
}
