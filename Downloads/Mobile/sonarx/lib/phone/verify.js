import * as Cellular from "expo-cellular";
export async function readSimPhoneNumber() {
    return "US";
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
