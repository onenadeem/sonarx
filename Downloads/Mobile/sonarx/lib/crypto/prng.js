import "react-native-get-random-values";
import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";
// Hook tweetnacl's PRNG directly into expo-crypto
// This bypasses the need for global polyfills and ensures
// tweetnacl always has secure random bytes available in Expo
nacl.setPRNG((x, n) => {
    const randomBytes = Crypto.getRandomBytes(n);
    for (let i = 0; i < n; i++) {
        x[i] = randomBytes[i];
    }
});
