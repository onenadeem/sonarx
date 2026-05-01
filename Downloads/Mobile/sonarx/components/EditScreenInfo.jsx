
import { ExternalLink } from "./ExternalLink";
import { MonoText } from "./StyledText";
import { Text, View } from "./Themed";
import Colors from "@/constants/Colors";
import { editScreenInfoStyles } from "@/src/theme/sharedStyles";
export default function EditScreenInfo({ path }) {
    return (<View>
      <View style={editScreenInfoStyles.getStartedContainer}>
        <Text style={styles.getStartedText} lightColor="rgba(0,0,0,0.8)" darkColor="rgba(255,255,255,0.8)">
          Open up the code for this screen:
        </Text>

        <View style={[editScreenInfoStyles.codeHighlightContainer, editScreenInfoStyles.homeScreenFilename]} darkColor="rgba(255,255,255,0.05)" lightColor="rgba(0,0,0,0.05)">
          <MonoText>{path}</MonoText>
        </View>

        <Text style={styles.getStartedText} lightColor="rgba(0,0,0,0.8)" darkColor="rgba(255,255,255,0.8)">
          Change any of the text, save the file, and your app will automatically
          update.
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink style={styles.helpLink} href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Tap here if your app doesn't automatically update after making
            changes
          </Text>
        </ExternalLink>
      </View>
    </View>);
}
const styles = editScreenInfoStyles;
