import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { Platform } from "react-native";
export function ExternalLink(props) {
    const { href, ...remainingProps } = props;
    const handlePress = (event) => {
        if (Platform.OS !== "web" && href) {
            event.preventDefault();
            WebBrowser.openBrowserAsync(href);
        }
    };
    return (<Link target="_blank" {...remainingProps} href={href} onPress={handlePress}/>);
}
