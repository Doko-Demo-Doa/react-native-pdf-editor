import type { DigestAlgorithm } from './specs/PdfSigningSession.nitro';
import type { Signer } from './Signer';

export interface SoftwareSignerOptions {
  /** Base64 DER certificate chain, leaf-first: [endEntityCertificate, ...chain]. */
  certificateChain: string[];

  /**
   * Signs a pre-computed digest with your in-memory private key and
   * returns the raw signature, base64-encoded. This package intentionally
   * does not bundle a crypto dependency — back this with whatever native
   * crypto library your app already uses (e.g. `react-native-quick-crypto`),
   * or a remote test-only signing endpoint.
   *
   * For an RSA key, wrap the digest in a `DigestInfo` first — see
   * {@link RSA_PKCS1_DIGEST_INFO_PREFIX_HEX}. For an EC key, sign the
   * digest directly.
   */
  rawSign: (
    digestBase64: string,
    algorithm: DigestAlgorithm
  ) => Promise<string>;

  /**
   * Fetches an RFC3161 timestamp token, base64-encoded. Only needed if you
   * intend to test `B-T`/`B-LT`/`B-LTA` conformance levels.
   */
  rawTimestamp?: (
    messageImprintBase64: string,
    algorithm: DigestAlgorithm
  ) => Promise<string>;
}

/**
 * A minimal `Signer` for local development/testing — no HSM/YubiKey/GoTrust
 * device involved, just an in-memory key you already control. See
 * `SoftwareSignerOptions.rawSign` for what you need to supply.
 */
export function createSoftwareSigner(options: SoftwareSignerOptions): Signer {
  return {
    async getCertificateChain() {
      return options.certificateChain;
    },
    async sign(digestBase64, algorithm) {
      return options.rawSign(digestBase64, algorithm);
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
