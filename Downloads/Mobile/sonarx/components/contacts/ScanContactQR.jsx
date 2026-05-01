import { useState, useEffect } from "react";
import { View, Modal, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
function ScanContactQR({ isOpen, onClose, onContactFound }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isOpen)
            return;
        setScanned(false);
        setError(null);
        if (!permission?.granted) {
            requestPermission();
        }
    }, [isOpen, permission?.granted, requestPermission]);
    const handleBarCodeScanned = ({ data }) => {
        if (scanned)
            return;
        setScanned(true);
        try {
            const contactData = JSON.parse(data);
            // Validate QR data format
            if (!contactData.v || !contactData.phone || !contactData.name || !contactData.pk || !contactData.spk) {
                setError("Invalid QR code format");
                setScanned(false);
                return;
            }
            // Create a PeerPresence from the QR data
            const presence = {
                peerId: contactData.phone,
                publicKey: contactData.pk,
                signingPublicKey: contactData.spk,
                displayName: contactData.name,
                timestamp: Date.now(),
                signature: "", // QR codes don't include signature, we'll trust direct scan
            };
            onContactFound(contactData.phone, presence);
            onClose();
        }
        catch {
            setError("Failed to parse QR code");
            setScanned(false);
        }
    };
    if (!isOpen)
        return null;
    if (!permission?.granted) {
        return (<Modal animationType="slide" transparent={true} visible={isOpen}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6">
            <H1 className="text-xl mb-4 text-center">Camera Permission</H1>
            <Muted className="mb-6 text-center">
              We need camera permission to scan QR codes
            </Muted>
            <Button onPress={requestPermission} className="w-full">
              Grant Permission
            </Button>
            <Button variant="outline" onPress={onClose} className="w-full mt-2">
              Cancel
            </Button>
          </View>
        </View>
      </Modal>);
    }
    return (<Modal animationType="slide" transparent={true} visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}/>

        <View className="absolute top-0 left-0 right-0 pt-12 pb-4 px-6 bg-gradient-to-b from-black/50 to-transparent">
          <View className="w-12 h-1 rounded-full bg-white/50 mx-auto mb-4"/>
          <H1 className="text-xl text-white text-center">Scan Contact QR</H1>
          <Muted className="text-white/70 text-center mt-1">
            Point camera at someone's contact QR code
          </Muted>
        </View>

        <View className="absolute bottom-0 left-0 right-0 pb-8 px-6">
          {error && (<View className="bg-destructive/90 p-3 rounded-lg mb-4">
              <Text className="text-white text-center">{error}</Text>
            </View>)}
          
          {scanned && (<View className="bg-primary/90 p-3 rounded-lg mb-4">
              <Text className="text-white text-center">Processing...</Text>
            </View>)}

          <Button variant="outline" onPress={onClose} className="w-full bg-white/10">
            <Text className="text-white">Cancel</Text>
          </Button>
        </View>
      </View>
    </Modal>);
}
export { ScanContactQR };
