import * as Cellular from "expo-cellular";
import { Platform } from "react-native";
export async function readSimPhoneNumber() {
    if (Platform.OS !== "android") {
        return null;
    }
    const methods = [Cellular.getPhoneNumberAsync, Cellular.getPhoneNumber];
    for (const getter of methods) {
        if (typeof getter !== "function")
            continue;
        try {
            const value = await getter.call(Cellular);
            if (typeof value === "string") {
                const normalized = value.trim();
                if (normalized) {
                    return normalized;
                }
            }
        }
        catch {
            // ignore and try the next available API
        }
    }
    return null;
}
export async function getCarrierInfo() {
    try {
        const [carrierName, isoCountryCode] = await Promise.all([
            Cellular.getCarrierNameAsync(),
            Cellular.getIsoCountryCodeAsync(),
        ]);
        return {
            carrierName,
            isoCountryCode,
        };
    }
    catch (error) {
        console.error("Failed to get carrier info:", error);
        return {
            carrierName: null,
            isoCountryCode: null,
        };
    }
}
