module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "inline-import", // For Drizzle SQL files
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};
