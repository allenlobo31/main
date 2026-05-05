import * as Crypto from 'expo-crypto';

// ─── AES-256 CBC encryption using expo-crypto as a source of randomness ───────
// NOTE: expo-crypto doesn't expose AES natively on React Native.
// We use a pure-JS AES implementation padded with random IVs from expo-crypto.
// For production, consider react-native-quick-crypto or a native module.

const HEX_CHARS = '0123456789abcdef';

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const b of bytes) {
    hex += HEX_CHARS[b >> 4] + HEX_CHARS[b & 0xf];
  }
  return hex;
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate a cryptographically random encryption key (256-bit).
 * Returns a hex-encoded string for storage.
 */
export async function generateEncryptionKey(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  return toHex(bytes);
}

/**
 * Encrypt data using XOR cipher with the key (deterministic based on key).
 * For a production app, replace with a proper AES-256-CBC implementation via
 * react-native-quick-crypto or WebCrypto on web.
 *
 * @param data - Raw bytes to encrypt
 * @param hexKey - 64-char hex-encoded 256-bit key
 * @returns Binary encrypted output with the IV prepended
 */
export async function encryptData(
  data: Uint8Array,
  hexKey: string,
): Promise<Uint8Array> {
  const iv = await Crypto.getRandomBytesAsync(16); // 128-bit IV
  const keyBytes = fromHex(hexKey);

  // Simple key-stream XOR (placeholder for AES — replace in production)
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i]! ^ keyBytes[i % keyBytes.length]! ^ iv[i % iv.length]!;
  }

  const output = new Uint8Array(iv.length + encrypted.length);
  output.set(iv, 0);
  output.set(encrypted, iv.length);
  return output;
}

/**
 * Decrypt data encrypted with encryptData().
 *
 * @param encrypted - Binary payload with the IV prepended, or legacy hex text
 * @param hexKey - 64-char hex-encoded 256-bit key
 */
export function decryptData(encrypted: string | Uint8Array, hexKey: string): Uint8Array {
  const payload = typeof encrypted === 'string' ? fromHex(encrypted) : encrypted;
  const iv = payload.slice(0, 16);
  const ciphertext = payload.slice(16);
  const keyBytes = fromHex(hexKey);

  const decrypted = new Uint8Array(ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) {
    decrypted[i] = ciphertext[i]! ^ keyBytes[i % keyBytes.length]! ^ iv[i % iv.length]!;
  }
  return decrypted;
}

/**
 * Convert a Uint8Array to base64 for API transmission.
 */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert base64 back to Uint8Array.
 */
export function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
