import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { getPeerPresence } from "@/lib/p2p/discovery";
import { detectCountryFromNumber, normalizePhoneNumber, } from "@/lib/phone/format";
import { useIdentityStore } from "@/stores/identity.store";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { OnlineIndicator } from "./OnlineIndicator";
import { ScanContactQR } from "./ScanContactQR";
import { ShareContactQR } from "./ShareContactQR";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
function AddContactSheet({ isOpen, onClose, onAddContact, }) {
    const colorScheme = useColorScheme();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundPeer, setFoundPeer] = useState(null);
    const [error, setError] = useState(null);
    const [showShareQR, setShowShareQR] = useState(false);
    const [showScanQR, setShowScanQR] = useState(false);
    const [mode, setMode] = useState("phone");
    const handleSearch = async () => {
        const myIdentity = useIdentityStore.getState().identity;
        const defaultCountry = myIdentity
            ? detectCountryFromNumber(myIdentity.phoneNumber)
            : "US";
        const normalized = normalizePhoneNumber(phoneNumber, defaultCountry);
        console.log("[AddContact] Searching for:", phoneNumber);
        console.log("[AddContact] Default country:", defaultCountry);
        console.log("[AddContact] Normalized:", normalized);
        console.log("[AddContact] My identity:", myIdentity?.phoneNumber);
        if (!normalized) {
            setError("Please enter a valid phone number");
            return;
        }
        if (myIdentity && myIdentity.phoneNumber === normalized) {
            setError("This is your own phone number.");
            return;
        }
        setIsSearching(true);
        setError(null);
        setFoundPeer(null);
        try {
            const presence = await getPeerPresence(normalized);
            console.log("[AddContact] Presence result:", presence);
            if (presence) {
                setFoundPeer(presence);
            }
            else {
                setError("This person isn't on SonarX yet. Invite them?");
            }
        }
        catch (err) {
            console.error("[AddContact] Search error:", err);
            setError("Failed to search for contact");
        }
        finally {
            setIsSearching(false);
        }
    };
    const handleAdd = () => {
        if (foundPeer) {
            const myIdentity = useIdentityStore.getState().identity;
            const defaultCountry = myIdentity
                ? detectCountryFromNumber(myIdentity.phoneNumber)
                : "US";
            const normalized = normalizePhoneNumber(phoneNumber, defaultCountry);
            if (normalized) {
                onAddContact(normalized, foundPeer);
                resetAndClose();
            }
        }
    };
    const resetAndClose = () => {
        onClose();
        setPhoneNumber("");
        setFoundPeer(null);
        setError(null);
        setMode("phone");
    };
    const handleQRContactFound = (peerId, presence) => {
        onAddContact(peerId, presence);
        setShowScanQR(false);
        resetAndClose();
    };
    if (!isOpen)
        return null;
    return (<>
      <View className="absolute inset-0 justify-end" style={{ backgroundColor: "rgba(3,7,12,0.65)" }}>
        <View className="bg-card rounded-t-3xl p-6 border border-border">
          <View className="w-12 h-1 rounded-full bg-muted mx-auto mb-4"/>

          <H1 className="text-xl mb-2">Add Contact</H1>
          <Muted className="mb-4">
            {mode === "phone"
            ? "Enter a phone number to find someone on SonarX"
            : "Share or scan a QR code to add contacts directly"}
          </Muted>

          {/* Mode Toggle */}
          <View className="flex-row mb-4 bg-muted rounded-lg p-1">
            <TouchableOpacity onPress={() => setMode("phone")} className={`flex-1 py-2 rounded-md ${mode === "phone" ? "bg-background border border-border" : ""}`}>
              <Text className={`text-center ${mode === "phone" ? "font-semibold" : ""}`}>
                Phone Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("qr")} className={`flex-1 py-2 rounded-md ${mode === "qr" ? "bg-background border border-border" : ""}`}>
              <Text className={`text-center ${mode === "qr" ? "font-semibold" : ""}`}>
                QR Code
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "phone" ? (<>
              <TextInput className="border border-input rounded-xl px-4 py-3 text-foreground bg-card" placeholder="Enter phone number" placeholderTextColor="hsl(var(--muted-foreground))" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad"/>

              {error && (<Text className="text-destructive mt-2 text-sm">{error}</Text>)}

              {foundPeer && (<View className="mt-4 p-4 bg-card rounded-lg border border-border">
                  <View className="flex-row items-center">
                    <Avatar name={foundPeer.displayName} size="md" isOnline={true}/>
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold">
                        {foundPeer.displayName}
                      </Text>
                      <OnlineIndicator isOnline={true} showLabel size="sm"/>
                    </View>
                  </View>
                </View>)}
            </>) : (<View className="space-y-3">
              <TouchableOpacity onPress={() => setShowShareQR(true)} className="bg-card rounded-lg p-4 flex-row items-center border border-border">
                <Ionicons name="share-outline" size={20} color={Colors[colorScheme].text} style={{ marginRight: 12 }}/>
                <View>
                  <Text className="font-semibold">Share Your QR</Text>
                  <Muted>Let someone scan to add you</Muted>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowScanQR(true)} className="bg-card rounded-lg p-4 flex-row items-center border border-border">
                <Ionicons name="qr-code-outline" size={20} color={Colors[colorScheme].text} style={{ marginRight: 12 }}/>
                <View>
                  <Text className="font-semibold">Scan QR Code</Text>
                  <Muted>Add someone by scanning their QR</Muted>
                </View>
              </TouchableOpacity>
            </View>)}

          <View className="flex-row gap-2 mt-4">
            <Button variant="outline" className="flex-1" onPress={resetAndClose}>
              Cancel
            </Button>
            {mode === "phone" &&
            (foundPeer ? (<Button className="flex-1" onPress={handleAdd}>
                  Add Contact
                </Button>) : (<Button className="flex-1" onPress={handleSearch} isLoading={isSearching}>
                  Search
                </Button>))}
          </View>
        </View>
      </View>

      <ShareContactQR isOpen={showShareQR} onClose={() => setShowShareQR(false)}/>
      <ScanContactQR isOpen={showScanQR} onClose={() => setShowScanQR(false)} onContactFound={handleQRContactFound}/>
    </>);
}
export { AddContactSheet };
