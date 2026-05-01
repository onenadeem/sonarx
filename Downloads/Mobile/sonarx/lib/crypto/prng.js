import "react-native-get-random-values";
import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";
// Hook tweetnacl's PRNG directly into expo-crypto.
const seedRandomBytes = (output, randomBytes) => {
    for (let i = 0; i < randomBytes.length; i += 1) {
        output[i] = randomBytes[i];
    }
};
// This bypasses the need for global polyfills and ensures
// tweetnacl always has secure random bytes available in Expo.
nacl.setPRNG((output, length) => {
    const randomBytes = Crypto.getRandomBytes(length);
    seedRandomBytes(output, randomBytes);
});
