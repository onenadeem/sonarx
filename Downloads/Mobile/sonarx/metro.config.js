const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const relayInput = "./global.css";

module.exports = withNativeWind(config, { input: relayInput });
