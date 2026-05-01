
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
export default function Icon({ name, size = 20, color, style }) {
    const { colors } = useTheme();
    return (<Ionicons name={name} size={size} color={color ?? colors.textSecondary} style={style}/>);
}
