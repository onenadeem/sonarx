import { useTheme } from "@/src/theme/ThemeProvider";
export { useTheme };
export function useColors() {
  return useTheme().colors;
}
