import { Text as DefaultText, View as DefaultView } from "react-native";
import { useColorScheme } from "./useColorScheme";
import Colors from "@/constants/Colors";
export function useThemeColor(props, colorName) {
    const theme = useColorScheme();
    const colorFromProps = props[theme];
    if (colorFromProps) {
        return colorFromProps;
    }
    else {
        return Colors[theme][colorName];
    }
}
const createThemedComponent = (Component, colorName, styleProperty) => {
    return function ThemedComponent(props) {
        const { style, lightColor, darkColor, ...otherProps } = props;
        const color = useThemeColor({ light: lightColor, dark: darkColor }, colorName);
        return <Component style={[{ [styleProperty]: color }, style]} {...otherProps}/>;
    };
};

export const Text = createThemedComponent(DefaultText, "text", "color");
export const View = createThemedComponent(DefaultView, "background", "backgroundColor");
