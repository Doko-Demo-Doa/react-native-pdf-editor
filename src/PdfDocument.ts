import { PdfEditorFactory } from './PdfEditorFactory';
import type { PdfDocument as PdfDocumentInstance } from './specs/PdfDocument.nitro';

export type {
  Standard14FontName,
  PdfPermissions,
  PdfEncryptionPermissions,
  PdfEncryptionInfo,
} from './specs/PdfDocument.nitro';

/** A loaded or newly created PDF document. See `PdfDocument.create`/`PdfDocument.open`. */
export type PdfDocument = PdfDocumentInstance;

export const PdfDocument = {
  /** Creates a new, empty PDF document. */
  create(): PdfDocument {
    return PdfEditorFactory.createDocument();
  },

  /**
   * Opens an existing PDF document from a file path.
   * @param password optional password for encrypted documents
   */
  open(path: string, password?: string): Promise<PdfDocument> {
    return PdfEditorFactory.openDocument(path, password);
  },

  /**
   * Checks whether the PDF at `path` is encrypted, without needing its
   * password and without having to open/close a document yourself.
   */
  isEncrypted(path: string): Promise<boolean> {
    return PdfEditorFactory.isEncrypted(path);
  },
};
