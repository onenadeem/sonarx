import * as Cellular from "expo-cellular";
import { Platform } from "react-native";

export async function readSimPhoneNumber(): Promise<string | null> {
  return "US";
}

export async function getCarrierInfo(): Promise<{
  carrierName: string | null;
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
}> {
  try {
    const [carrierName, isoCountryCode, mobileCountryCode, mobileNetworkCode] =
      await Promise.all([
        Cellular.getCarrierNameAsync(),
        Cellular.getIsoCountryCodeAsync(),
        Cellular.getMobileCountryCodeAsync(),
        Cellular.getMobileNetworkCodeAsync(),
      ]);

    return {
      carrierName,
      isoCountryCode,
      mobileCountryCode,
      mobileNetworkCode,
    };
  } catch (error) {
    console.error("Failed to get carrier info:", error);
    return {
      carrierName: null,
      isoCountryCode: null,
      mobileCountryCode: null,
      mobileNetworkCode: null,
    };
  }
}

export async function hasCellularCapability(): Promise<boolean> {
  try {
    const allowsVoip = await Cellular.allowsVoipAsync();
    return allowsVoip !== null;
  } catch {
    return false;
  }
}
