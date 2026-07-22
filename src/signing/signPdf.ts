import { PdfEditorFactory } from '../PdfEditorFactory';
import type {
  DigestAlgorithm,
  PadesConformanceLevel,
  PdfSigningSession,
  PdfVisibleImageSignatureOptions,
  PdfVisibleTextSignatureOptions,
} from '../specs/PdfSigningSession.nitro';
import type { Signer } from './signer';

export type { PdfSigningSession } from '../specs/PdfSigningSession.nitro';

/**
 * Validation data to embed in the DSS (Document Security Store) for
 * `B-LT`/`B-LTA` — base64 DER certs/CRLs/OCSP responses. `PdfSigningSession`
 * can build the OCSP/CRL *requests* (`getCrlFromCertificate`,
 * `buildOCSPRequest`, ...) and parse the responses, but it does not perform
 * HTTP itself or decide what to trust — gathering this data (fetching the
 * URLs those helpers give you) is your app's responsibility.
 */
export interface ValidationData {
  certificates?: string[];
  crls?: string[];
  ocsps?: string[];
}

export interface SignPdfOptions {
  /** Path to the unsigned source PDF. */
  inputPath: string;
  /** Path to write the signed PDF to. */
  outputPath: string;
  conformanceLevel: PadesConformanceLevel;
  /** @default 'SHA256' */
  hashAlgorithm?: DigestAlgorithm;
  /** Optional base64 DER root/trust-anchor certificate. */
  rootCertificate?: string;
  /** Optional visible text signature placement. Omit for an invisible signature. */
  visibleTextSignature?: PdfVisibleTextSignatureOptions;
  /** Optional visible image signature placement. Omit for an invisible signature. */
  visibleImageSignature?: PdfVisibleImageSignatureOptions;
  /** Required for `B-LT`/`B-LTA` — see {@link ValidationData}. */
  validationData?: ValidationData;
}

/**
 * Signs a PDF file with an external `Signer`, orchestrating PoDoFo's
 * hash-then-sign `PdfSigningSession` end to end:
 *
 * 1. Ask the signer for its certificate chain and open a signing session.
 * 2. `beginSigning()` to get the hash to sign, hand it to `signer.sign()`.
 * 3. For `B-T` and above, get an RFC3161 timestamp via `signer.timestamp()`.
 * 4. `finishSigning()` with the signature (+ timestamp + validation data).
 * 5. For `B-LTA`, a second `beginSigningLTA()`/`finishSigningLTA()` round
 *    trip for the archival document timestamp.
 *
 * For manual control (e.g. driving the OCSP/CRL/TSR helpers yourself),
 * use `PdfSigningSession` directly via `PdfEditorFactory.createSigningSession`.
 */
export async function signPdf(
  signer: Signer,
  options: SignPdfOptions
): Promise<void> {
  const hashAlgorithm = options.hashAlgorithm ?? 'SHA256';
  const [endCertificate, ...certificateChain] =
    await signer.getCertificateChain();
  if (!endCertificate) {
    throw new Error(
      'Signer.getCertificateChain() must return at least the end-entity certificate.'
    );
  }

  const session: PdfSigningSession = PdfEditorFactory.createSigningSession({
    conformanceLevel: options.conformanceLevel,
    hashAlgorithm,
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    endCertificate,
    certificateChain,
    rootCertificate: options.rootCertificate,
    visibleTextSignature: options.visibleTextSignature,
    visibleImageSignature: options.visibleImageSignature,
  });

  const digest = await session.beginSigning();
  const signature = await signer.sign(digest, hashAlgorithm);

  let timestampToken: string | undefined;
  if (options.conformanceLevel !== 'B-B') {
    if (!signer.timestamp) {
      throw new Error(
        `Signer must implement timestamp() for conformance level "${options.conformanceLevel}".`
      );
    }
    timestampToken = await signer.timestamp(digest, hashAlgorithm);
  }

  await session.finishSigning(
    signature,
    timestampToken,
    options.validationData?.certificates,
    options.validationData?.crls,
    options.validationData?.ocsps
  );

  if (options.conformanceLevel === 'B-LTA') {
    if (!signer.timestamp) {
      throw new Error(
        'Signer must implement timestamp() for conformance level "B-LTA".'
      );
    }
    const ltaDigest = await session.beginSigningLTA();
    const ltaTimestampToken = await signer.timestamp(ltaDigest, hashAlgorithm);
    await session.finishSigningLTA(
      ltaTimestampToken,
      options.validationData?.certificates,
      options.validationData?.crls,
      options.validationData?.ocsps
    );
  }
}
