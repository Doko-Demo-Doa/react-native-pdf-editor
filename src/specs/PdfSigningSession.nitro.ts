import type { HybridObject } from 'react-native-nitro-modules';

/** Matches PoDoFo's own PdfHashingAlgorithm names (the only 3 the remote-signing session supports). */
export type DigestAlgorithm = 'SHA256' | 'SHA384' | 'SHA512';

/**
 * PAdES conformance/baseline level, matching PoDoFo's own ADES_B_* names.
 * - `B-B`: basic CAdES-BES signature, no timestamp.
 * - `B-T`: adds an RFC3161 signature timestamp.
 * - `B-LT`: adds a DSS (Document Security Store) with certs/CRLs/OCSP for long-term validation.
 * - `B-LTA`: adds a document timestamp on top of B-LT, for long-term archival.
 */
export type PadesConformanceLevel = 'B-B' | 'B-T' | 'B-LT' | 'B-LTA';

/** Image scaling behavior for a visible signature appearance. */
export type PdfVisibleSignatureImageFit = 'contain' | 'stretch';

/**
 * Image rendered inside a visible signature appearance.
 *
 * Provide exactly one of `path`, `base64`, or `bytes`.
 */
export interface PdfVisibleSignatureImageOptions {
  /** Image file path. Best for large images because native code can load it directly. */
  path?: string;
  /** Raw base64 image bytes. A data URL prefix is also accepted by native code. */
  base64?: string;
  /** Raw encoded image bytes, for example PNG or JPEG data. */
  bytes?: ArrayBuffer;
  /**
   * How to scale the image inside the widget.
   * @default 'contain'
   */
  fit?: PdfVisibleSignatureImageFit;
}

/**
 * Describes a visible text signature widget created by {@linkcode PdfSigningSession}.
 *
 * Coordinates are PDF user-space units with a bottom-left origin.
 */
export interface PdfVisibleTextSignatureOptions {
  /** Zero-based page index that receives the signature widget. */
  pageIndex: number;
  /** Left coordinate of the widget rectangle in PDF units. */
  x: number;
  /** Bottom coordinate of the widget rectangle in PDF units. */
  y: number;
  /** Widget rectangle width in PDF units. */
  width: number;
  /** Widget rectangle height in PDF units. */
  height: number;
  /** Text rendered inside the widget appearance. */
  text: string;
  /** Optional font family/name used for the visible appearance text. */
  fontName?: string;
  /** Optional signer name stored in the signature dictionary. */
  signerName?: string;
  /** Optional signing reason stored in the signature dictionary. */
  reason?: string;
  /** Optional signing location stored in the signature dictionary. */
  location?: string;
  /** Optional signer contact info stored in the signature dictionary. */
  contactInfo?: string;
}

/**
 * Describes a visible image signature widget created by {@linkcode PdfSigningSession}.
 *
 * Coordinates are PDF user-space units with a bottom-left origin.
 */
export interface PdfVisibleImageSignatureOptions {
  /** Zero-based page index that receives the signature widget. */
  pageIndex: number;
  /** Left coordinate of the widget rectangle in PDF units. */
  x: number;
  /** Bottom coordinate of the widget rectangle in PDF units. */
  y: number;
  /** Widget rectangle width in PDF units. */
  width: number;
  /** Widget rectangle height in PDF units. */
  height: number;
  /** Image rendered inside the widget appearance. */
  image: PdfVisibleSignatureImageOptions;
  /** Optional signer name stored in the signature dictionary. */
  signerName?: string;
  /** Optional signing reason stored in the signature dictionary. */
  reason?: string;
  /** Optional signing location stored in the signature dictionary. */
  location?: string;
  /** Optional signer contact info stored in the signature dictionary. */
  contactInfo?: string;
}

export interface PdfSigningSessionOptions {
  conformanceLevel: PadesConformanceLevel;
  hashAlgorithm: DigestAlgorithm;
  /** Path to the unsigned source PDF. */
  inputPath: string;
  /** Path to write the signed PDF to. */
  outputPath: string;
  /** Base64 DER end-entity (leaf) signing certificate. */
  endCertificate: string;
  /** Base64 DER certificate chain, not including the end-entity certificate. */
  certificateChain: string[];
  /** Optional base64 DER root/trust-anchor certificate. */
  rootCertificate?: string;
  /**
   * Optional visible text signature placement. Omit both visible signature
   * options for the default invisible signature workflow.
   */
  visibleTextSignature?: PdfVisibleTextSignatureOptions;
  /**
   * Optional visible image signature placement. Omit both visible signature
   * options for the default invisible signature workflow.
   */
  visibleImageSignature?: PdfVisibleImageSignatureOptions;
}

/**
 * Direct binding onto PoDoFo's `PdfRemoteSignDocumentSession` (iOS) /
 * `PoDoFoWrapper` (Android, itself a thin wrapper over the same C++ class) —
 * a purpose-built two-phase hash-then-sign session: compute a hash, have it
 * signed externally (by a `Signer` — see `signPdf`), inject the result back.
 *
 * All certificate/CRL/OCSP/TSR parameters are base64 DER, flat (no PEM
 * headers, no line wraps) — confirmed by reading the fork's own
 * `ConvertBase64PEMtoDER` implementation, which does a plain base64 decode
 * despite its name.
 */
export interface PdfSigningSession extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  /**
   * Computes the document hash to be signed remotely and returns it as
   * plain base64 (the underlying native call actually returns this
   * URL-encoded — this binding decodes that internally so callers never
   * see the encoding quirk).
   */
  beginSigning(): Promise<string>;

  /**
   * Finishes signing by injecting the externally-computed signature — and,
   * for B-T and above, an RFC3161 timestamp token — into the document.
   * @param signatureBase64 base64-encoded raw signature bytes from the external signer
   * @param timestampTokenBase64 base64-encoded RFC3161 TimeStampResp — required for B-T/B-LT/B-LTA
   * @param certificates base64 DER certs to embed in the DSS (B-LT/B-LTA only)
   * @param crls base64 DER CRLs to embed in the DSS (B-LT/B-LTA only)
   * @param ocsps base64 DER OCSP responses to embed in the DSS (B-LT/B-LTA only)
   */
  finishSigning(
    signatureBase64: string,
    timestampTokenBase64?: string,
    certificates?: string[],
    crls?: string[],
    ocsps?: string[]
  ): Promise<void>;

  /**
   * Starts a DocTimeStamp (RFC3161) LTA update on the already-signed output
   * file — call after `finishSigning` for conformance level `B-LTA`.
   * @returns base64 hash to send to the TSA
   */
  beginSigningLTA(): Promise<string>;

  /** Completes the DocTimeStamp flow with the TSA's response. */
  finishSigningLTA(
    timestampTokenBase64: string,
    certificates?: string[],
    crls?: string[],
    ocsps?: string[]
  ): Promise<void>;

  /** Extracts the first CRL distribution point URL from a base64 DER certificate. */
  getCrlFromCertificate(certificateBase64: string): string;

  /** Extracts the TSA signer certificate (base64 DER) from a base64-encoded TSR. */
  extractSignerCertFromTSR(tsrBase64: string): string;

  /** Extracts the TSA issuer certificate (base64 DER) from a base64-encoded TSR. */
  extractIssuerCertFromTSR(tsrBase64: string): string;

  /** Extracts the OCSP responder URL from a certificate's AIA extension. */
  getOCSPResponderUrl(
    certificateBase64: string,
    issuerCertificateBase64: string
  ): string;

  /** Builds a base64-encoded OCSP request from a certificate + its issuer. */
  buildOCSPRequest(
    certificateBase64: string,
    issuerCertificateBase64: string
  ): string;

  /** Extracts the CA Issuers URL (AIA extension) from a base64 DER certificate. */
  getCertificateIssuerUrl(certificateBase64: string): string;
}
