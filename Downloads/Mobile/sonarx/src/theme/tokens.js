import { borderRadius } from '@/constants/borderRadius';
import { elevation } from '@/constants/elevation';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { darkTheme, lightTheme } from './palette';
export const lightColors = {
    ...lightTheme,
    textDisabled: lightTheme.disabled,
    accentMuted: lightTheme.secondary,
};
export const darkColors = {
    ...darkTheme,
    textDisabled: darkTheme.disabled,
    accentMuted: darkTheme.secondary,
};
export { spacing, typography, borderRadius };
export const shadows = elevation;
export const elevationTokens = elevation;
