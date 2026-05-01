import * as Cellular from "expo-cellular";
export async function readSimPhoneNumber() {
    return "US";
}
export async function getCarrierInfo() {
    try {
        const [carrierName, isoCountryCode, mobileCountryCode, mobileNetworkCode] = await Promise.all([
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
    }
    catch (error) {
        console.error("Failed to get carrier info:", error);
        return {
            carrierName: null,
            isoCountryCode: null,
            mobileCountryCode: null,
            mobileNetworkCode: null,
        };
    }
}
export async function hasCellularCapability() {
    try {
        const allowsVoip = await Cellular.allowsVoipAsync();
        return allowsVoip !== null;
    }
    catch {
        return false;
    }
}
