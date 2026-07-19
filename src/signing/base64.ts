/* oxlint-disable no-bitwise -- bit manipulation is inherent to base64/binary encoding, not a stray typo */
/**
 * Minimal, dependency-free base64/hex helpers — just enough to prepend a
 * `DigestInfo` prefix onto a digest for RSA PKCS#1 v1.5 signing (see
 * `createSigner.ts`). Not exported from the public API; internal only.
 */

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]!;
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    result += BASE64_CHARS.charAt(b1 >> 2);
    result += BASE64_CHARS.charAt(
      ((b1 & 0x03) << 4) | (b2 === undefined ? 0 : b2 >> 4)
    );
    result +=
      b2 === undefined
        ? '='
        : BASE64_CHARS.charAt(
            ((b2 & 0x0f) << 2) | (b3 === undefined ? 0 : b3 >> 6)
          );
    result += b3 === undefined ? '=' : BASE64_CHARS.charAt(b3 & 0x3f);
  }
  return result;
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}
