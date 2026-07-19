export { PdfDocument } from './PdfDocument';
export type { Standard14FontName, PdfPermissions } from './PdfDocument';
export type { PdfPage, PdfTextEntry } from './specs/PdfPage.nitro';
export type { PdfField, PdfFieldType } from './specs/PdfField.nitro';
export type { PdfFont } from './specs/PdfFont.nitro';
export type { PdfImage } from './specs/PdfImage.nitro';
export type { PdfPainter } from './specs/PdfPainter.nitro';
export type {
  PdfAnnotation,
  PdfAnnotationType,
  PdfRect,
} from './specs/PdfAnnotation.nitro';

export type { DigestAlgorithm, PadesConformanceLevel, Signer } from './Signer';
export {
  DIGEST_ALGORITHM_OIDS,
  RSA_PKCS1_DIGEST_INFO_PREFIX_HEX,
} from './Signer';

export { signPdf } from './SignPdf';
export type {
  SignPdfOptions,
  ValidationData,
  PdfSigningSession,
} from './SignPdf';

export { createSoftwareSigner } from './CreateSoftwareSigner';
export type { SoftwareSignerOptions } from './CreateSoftwareSigner';

export { PdfEditorFactory } from './PdfEditorFactory';
export type { PdfSigningSessionOptions } from './specs/PdfSigningSession.nitro';

export { renderPageToBitmap } from './RenderPage';
export type { PdfPageBitmap, RenderPageOptions } from './RenderPage';
