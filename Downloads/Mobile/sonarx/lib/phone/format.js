import { parsePhoneNumber, isValidPhoneNumber, } from "libphonenumber-js";
export function normalizePhoneNumber(input, countryCode = "US") {
    try {
        const phoneNumber = parsePhoneNumber(input, countryCode);
        if (phoneNumber && isValidPhoneNumber(phoneNumber.number)) {
            return phoneNumber.format("E.164");
        }
        return null;
    }
    catch {
        return null;
    }
}
export function formatPhoneDisplay(e164) {
    try {
        const phoneNumber = parsePhoneNumber(e164);
        if (phoneNumber) {
            return phoneNumber.formatInternational();
        }
        return e164;
    }
    catch {
        return e164;
    }
}
export function getCountryCode(e164) {
    try {
        const phoneNumber = parsePhoneNumber(e164);
        if (phoneNumber) {
            return `+${phoneNumber.countryCallingCode}`;
        }
        return null;
    }
    catch {
        return null;
    }
}
export function getNationalNumber(e164) {
    try {
        const phoneNumber = parsePhoneNumber(e164);
        if (phoneNumber) {
            return phoneNumber.nationalNumber.toString();
        }
        return null;
    }
    catch {
        return null;
    }
}
export function detectCountryFromNumber(phoneNumber) {
    try {
        const parsed = parsePhoneNumber(phoneNumber);
        if (parsed && parsed.country) {
            return parsed.country;
        }
    }
    catch {
        return "US";
    }
    return "US";
}
