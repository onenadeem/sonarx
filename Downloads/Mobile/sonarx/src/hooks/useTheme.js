export { useTheme } from '@/src/theme/ThemeProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
export function useColors() {
    return useTheme().colors;
}
