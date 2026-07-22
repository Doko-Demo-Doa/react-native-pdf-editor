/**
 * Signing-related API — kept on a separate entry point (`react-native-pdf-editor/signing`)
 * so apps that only edit/create PDFs don't pull in signing concepts they don't need.
 */
export type {
  DigestAlgorithm,
  PadesConformanceLevel,
  Signer,
} from './signing/signer';
export {
  DIGEST_ALGORITHM_OIDS,
  RSA_PKCS1_DIGEST_INFO_PREFIX_HEX,
} from './signing/signer';

export { signPdf } from './signing/signPdf';
export type {
  SignPdfOptions,
  ValidationData,
  PdfSigningSession,
} from './signing/signPdf';

export { createSigner } from './signing/createSigner';
export type { CreateSignerOptions } from './signing/createSigner';

export { PdfEditorFactory } from './PdfEditorFactory';
export type {
  PdfSigningSessionOptions,
  PdfVisibleImageSignatureOptions,
  PdfVisibleSignatureImageFit,
  PdfVisibleSignatureImageOptions,
  PdfVisibleTextSignatureOptions,
} from './specs/PdfSigningSession.nitro';
