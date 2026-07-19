import type { DigestAlgorithm } from '../specs/PdfSigningSession.nitro';

export type {
  DigestAlgorithm,
  PadesConformanceLevel,
} from '../specs/PdfSigningSession.nitro';

/**
 * OIDs for the digest algorithms `PdfSigningSession` supports — useful if
 * you need the algorithm's OID for your own purposes (e.g. building an
 * ASN.1 `DigestInfo` prefix for RSA PKCS#1 v1.5 signing — see
 * {@link RSA_PKCS1_DIGEST_INFO_PREFIX_HEX}). Confirmed against the podofo
 * fork's own `hashAlgorithmFromOid` implementation.
 */
export const DIGEST_ALGORITHM_OIDS: Record<DigestAlgorithm, string> = {
  SHA256: '2.16.840.1.101.3.4.2.1',
  SHA384: '2.16.840.1.101.3.4.2.2',
  SHA512: '2.16.840.1.101.3.4.2.3',
};

/**
 * Precomputed ASN.1 DER `DigestInfo` prefixes (hex), for RSA PKCS#1 v1.5
 * signing: prepend the bytes of `RSA_PKCS1_DIGEST_INFO_PREFIX_HEX[algorithm]`
 * to the raw digest {@link Signer.sign} receives before handing it to an
 * RSA `rawSignOrDecrypt`-style primitive (e.g. a YubiKey/HSM PIV signer).
 * Not needed for ECDSA keys, which sign the raw digest directly with no
 * ASN.1 wrapping.
 *
 * @example
 * ```ts
 * function toDigestInfoBase64(digestBase64: string, algorithm: DigestAlgorithm): string {
 *   const prefix = RSA_PKCS1_DIGEST_INFO_PREFIX_HEX[algorithm];
 *   const prefixBytes = hexToBytes(prefix); // bring your own hex/base64 helpers
 *   const digestBytes = base64ToBytes(digestBase64);
 *   return bytesToBase64(new Uint8Array([...prefixBytes, ...digestBytes]));
 * }
 * ```
 */
export const RSA_PKCS1_DIGEST_INFO_PREFIX_HEX: Record<DigestAlgorithm, string> =
  {
    SHA256: '3031300d060960864801650304020105000420',
    SHA384: '3041300d060960864801650304020205000430',
    SHA512: '3051300d060960864801650304020305000440',
  };

/**
 * The signer-agnostic interface `signPdf` (and `PdfSigningSession` directly,
 * for manual control) drive to have a document signed by an external key —
 * YubiKey, HSM, GoTrust, a cloud KMS/remote-signing service, or an
 * in-memory key for dev/testing. The core library never knows which of
 * these it's talking to.
 *
 * Every byte payload here is base64 — matching `PdfSigningSession`'s own
 * wire format (which, in turn, is what `PdfRemoteSignDocumentSession`
 * actually expects: confirmed by reading the fork's C++ source, everything
 * is base64 DER/base64 hash/base64 signature, never PEM, never raw bytes).
 */
export interface Signer {
  /**
   * Returns the certificate chain to embed in the signature, leaf-first:
   * `[endEntityCertificate, ...chain]` (not including the root — pass that
   * separately via `SignPdfOptions.rootCertificate` if needed). Each
   * certificate is base64 DER, flat (no PEM headers, no line wraps).
   */
  getCertificateChain(): Promise<string[]>;

  /**
   * Signs a pre-computed digest and returns the raw signature bytes,
   * base64-encoded. For an RSA key, the digest must be wrapped in a
   * `DigestInfo` first — see {@link RSA_PKCS1_DIGEST_INFO_PREFIX_HEX}. For
   * an EC key, sign the digest directly.
   */
  sign(digestBase64: string, algorithm: DigestAlgorithm): Promise<string>;

  /**
   * Fetches an RFC3161 timestamp token for the given message imprint and
   * returns it base64-encoded (a TimeStampResp). Required for conformance
   * levels `B-T`/`B-LT`/`B-LTA` — `signPdf` throws if this level is
   * requested and no `timestamp` is implemented.
   */
  timestamp?(
    messageImprintBase64: string,
    algorithm: DigestAlgorithm
  ): Promise<string>;
}
