import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
const parseNumber = (value, countryCode = "US") => {
  try {
    return parsePhoneNumber(value, countryCode);
  } catch {
    return null;
  }
};
export function normalizePhoneNumber(input, countryCode = "US") {
  const phoneNumber = parseNumber(input, countryCode);
  if (!phoneNumber || !isValidPhoneNumber(phoneNumber.number)) {
    return null;
  }
  return phoneNumber.format("E.164");
}
export function formatPhoneDisplay(e164) {
  const phoneNumber = parseNumber(e164);
  if (!phoneNumber) {
    return e164;
  }
  return phoneNumber.formatInternational();
}
export function getCountryCode(e164) {
  const phoneNumber = parseNumber(e164);
  if (!phoneNumber) {
    return null;
  }
  return `+${phoneNumber.countryCallingCode}`;
}
export function getNationalNumber(e164) {
  const phoneNumber = parseNumber(e164);
  if (!phoneNumber) {
    return null;
  }
  return phoneNumber.nationalNumber.toString();
}
export function detectCountryFromNumber(phoneNumber) {
  const parsed = parseNumber(phoneNumber);
  if (!parsed || !parsed.country) {
    return "US";
  }
  return parsed.country;
}
