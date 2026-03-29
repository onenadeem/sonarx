import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

export function normalizePhoneNumber(
  input: string,
  countryCode: CountryCode = "US",
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(input, countryCode);
    if (phoneNumber && isValidPhoneNumber(phoneNumber.number)) {
      return phoneNumber.format("E.164");
    }
    return null;
  } catch {
    return null;
  }
}

export function formatPhoneDisplay(e164: string): string {
  try {
    const phoneNumber = parsePhoneNumber(e164);
    if (phoneNumber) {
      return phoneNumber.formatInternational();
    }
    return e164;
  } catch {
    return e164;
  }
}

export function getCountryCode(e164: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(e164);
    if (phoneNumber) {
      return `+${phoneNumber.countryCallingCode}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function getNationalNumber(e164: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(e164);
    if (phoneNumber) {
      return phoneNumber.nationalNumber.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function detectCountryFromNumber(phoneNumber: string): CountryCode {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed && parsed.country) {
      return parsed.country as CountryCode;
    }
  } catch {
    return "US";
  }
  return "US";
}
