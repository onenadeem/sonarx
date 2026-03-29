import { useEffect, useState } from "react";
import { View, Modal, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useIdentityStore } from "@/stores/identity.store";

interface ShareContactQRProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactQRData {
  v: number;
  phone: string;
  name: string;
  pk: string; // public key
  spk: string; // signing public key
}

function ShareContactQR({ isOpen, onClose }: ShareContactQRProps) {
  const identity = useIdentityStore((state) => state.identity);
  const [qrData, setQrData] = useState<string>("");

  useEffect(() => {
    if (identity && isOpen) {
      const data: ContactQRData = {
        v: 1,
        phone: identity.phoneNumber,
        name: identity.displayName,
        pk: identity.publicKey,
        spk: identity.signingPublicKey,
      };
      setQrData(JSON.stringify(data));
    }
  }, [identity, isOpen]);

  if (!isOpen || !identity) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6">
          <View className="w-12 h-1 rounded-full bg-muted mx-auto mb-4" />

          <H1 className="text-xl mb-2 text-center">Share Your Contact</H1>
          <Muted className="mb-6 text-center">
            Have someone scan this QR code to add you
          </Muted>

          <View className="items-center mb-6">
            <View className="bg-white p-4 rounded-xl">
              {qrData ? (
                <QRCode
                  value={qrData}
                  size={250}
                  backgroundColor="white"
                  color="black"
                />
              ) : (
                <View className="w-[250px] h-[250px] bg-gray-200 items-center justify-center">
                  <Text>Loading...</Text>
                </View>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-center font-semibold text-lg">
              {identity.displayName}
            </Text>
            <Muted className="text-center">{identity.phoneNumber}</Muted>
          </View>

          <Button variant="outline" onPress={onClose} className="w-full">
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export { ShareContactQR };
export type { ContactQRData };
