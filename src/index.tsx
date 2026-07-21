export { PdfDocument } from './PdfDocument';
export type {
  Standard14FontName,
  PdfPermissions,
  PdfEncryptionPermissions,
  PdfEncryptionInfo,
} from './PdfDocument';
export type { PdfPage, PdfTextEntry } from './specs/PdfPage.nitro';
export type {
  PdfField,
  PdfFieldType,
  PdfSignatureInfo,
  PdfSignatureVerificationStatus,
} from './specs/PdfField.nitro';
export type { PdfFont } from './specs/PdfFont.nitro';
export type { PdfImage } from './specs/PdfImage.nitro';
export type { PdfPainter } from './specs/PdfPainter.nitro';
export type {
  PdfAnnotation,
  PdfAnnotationType,
  PdfRect,
} from './specs/PdfAnnotation.nitro';

export { PdfRenderer } from './PdfRenderer';
export type {
  PdfBitmapImageFormat,
  PdfPageBitmap,
  RenderPageOptions,
  WriteBitmapToImageOptions,
} from './PdfRenderer';

// Signing (Signer, signPdf, PdfSigningSession, ...) lives on a separate entry
// point — import from 'react-native-pdf-editor/signing' instead.
