import { Text } from "./Themed";
const MONO_FONT_FAMILY = "SpaceMono";
export function MonoText(props) {
    return <Text {...props} style={[props.style, { fontFamily: MONO_FONT_FAMILY }]}/>;
}
