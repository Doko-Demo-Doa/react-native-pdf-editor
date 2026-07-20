import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfDocument } from './PdfDocument.nitro';
import type {
  PdfSigningSession,
  PdfSigningSessionOptions,
} from './PdfSigningSession.nitro';
import type { PdfPageBitmap, RenderPageOptions } from './PdfRendering.nitro';

export interface PdfEditor extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  /** Creates a new, empty PDF document. */
  createDocument(): PdfDocument;

  /**
   * Opens an existing PDF document from a file path.
   * @param password optional password for encrypted documents
   */
  openDocument(path: string, password?: string): Promise<PdfDocument>;

  /**
   * Checks whether the PDF at `path` is encrypted, without needing its
   * password. Rejects if the file can't be parsed at all (e.g. not a valid
   * PDF, or doesn't exist) - not merely because it happens to be encrypted.
   */
  isEncrypted(path: string): Promise<boolean>;

  /** Creates a hash-then-sign session for externally (e.g. HSM/YubiKey) signing a PDF file. */
  createSigningSession(options: PdfSigningSessionOptions): PdfSigningSession;

  /** Rasterizes a page from a PDF file to an RGBA8888 bitmap — see PdfRendering.nitro.ts. */
  renderPageToBitmap(options: RenderPageOptions): Promise<PdfPageBitmap>;

  /** Encodes an RGBA8888 bitmap from {@link renderPageToBitmap} to an image file. */
  writeBitmapToImage(
    bitmap: PdfPageBitmap,
    outputPath: string,
    format: string
  ): Promise<void>;
}
