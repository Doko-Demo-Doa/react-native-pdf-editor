import type { DigestAlgorithm } from '../specs/PdfSigningSession.nitro';
import type { Signer } from './signer';
import { RSA_PKCS1_DIGEST_INFO_PREFIX_HEX } from './signer';
import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  hexToBytes,
} from './base64';

export interface CreateSignerOptions {
  /**
   * The key's algorithm family. RSA keys need the digest wrapped in an
   * ASN.1 `DigestInfo` before signing (handled for you here); EC keys sign
   * the raw digest directly.
   */
  keyAlgorithm: 'RSA' | 'EC';

  /**
   * The certificate chain to embed in the signature, base64 DER,
   * leaf-first. Pass a static array if you already have it on hand (e.g.
   * an in-memory dev key), or an async function if fetching it requires a
   * round trip (e.g. reading a certificate off a YubiKey/HSM slot).
   */
  certificateChain: string[] | (() => Promise<string[]>);

  /**
   * Signs a payload with the private key and returns the raw signature,
   * base64-encoded. This package intentionally does not bundle a crypto
   * dependency — back this with whatever your key is actually held by:
   * OpenSSL/`react-native-quick-crypto` for an in-memory key, a PKCS#11
   * `C_Sign`, YubiKit PIV's `rawSignOrDecrypt`, a GoTrust/HSM/cloud KMS
   * raw-sign primitive, or similar.
   *
   * For `keyAlgorithm: 'RSA'`, `payloadBase64` is already `DigestInfo`-wrapped
   * before this is called. For `'EC'`, it's the raw digest.
   */
  rawSign: (
    payloadBase64: string,
    algorithm: DigestAlgorithm
  ) => Promise<string>;

  /**
   * Fetches an RFC3161 timestamp token, base64-encoded. Required for
   * `B-T`/`B-LT`/`B-LTA` conformance levels.
   */
  rawTimestamp?: (
    messageImprintBase64: string,
    algorithm: DigestAlgorithm
  ) => Promise<string>;
}

function wrapDigestInfo(
  digestBase64: string,
  algorithm: DigestAlgorithm
): string {
  const prefix = hexToBytes(RSA_PKCS1_DIGEST_INFO_PREFIX_HEX[algorithm]);
  const digest = base64ToBytes(digestBase64);
  return bytesToBase64(concatBytes(prefix, digest));
}

/**
 * Builds a `Signer` around a raw sign/decrypt primitive — the private key
 * never needs to leave wherever it's held (in-memory, PKCS#11, YubiKey PIV,
 * GoTrust, an HSM, a cloud KMS, ...). `signPdf`/`PdfSigningSession` only
 * ever see the `Signer` interface, not which of these backs it.
 *
 * @example
 * ```ts
 * // in-memory dev key
 * const signer = createSigner({
 *   keyAlgorithm: 'RSA',
 *   certificateChain: [devCertBase64Der],
 *   rawSign: (payloadBase64) => mySign(payloadBase64),
 * });
 *
 * // hardware-backed key (illustrative — wraps a real SDK's own async calls)
 * const signer = createSigner({
 *   keyAlgorithm: 'RSA',
 *   certificateChain: () => getCertificate(deviceHandle, slot).then((c) => [c]),
 *   rawSign: (payloadBase64) => rawSignOrDecrypt(deviceHandle, slot, keyType, payloadBase64),
 * });
 * ```
 */
export function createSigner(options: CreateSignerOptions): Signer {
  return {
    async getCertificateChain() {
      return typeof options.certificateChain === 'function'
        ? options.certificateChain()
        : options.certificateChain;
    },
    async sign(digestBase64, algorithm) {
      const payload =
        options.keyAlgorithm === 'RSA'
          ? wrapDigestInfo(digestBase64, algorithm)
          : digestBase64;
      return options.rawSign(payload, algorithm);
    },
    ...(options.rawTimestamp
      ? {
          async timestamp(
            messageImprintBase64: string,
            algorithm: DigestAlgorithm
          ) {
            return options.rawTimestamp!(messageImprintBase64, algorithm);
          },
        }
      : {}),
  };
}
