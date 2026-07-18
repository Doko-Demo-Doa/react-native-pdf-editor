import { NitroModules } from 'react-native-nitro-modules';
import type { PdfEditor } from './PdfEditor.nitro';
import type { PdfDocument as PdfDocumentInstance } from './PdfDocument.nitro';

const factory = NitroModules.createHybridObject<PdfEditor>('PdfEditor');

export type { Standard14FontName } from './PdfDocument.nitro';

/** A loaded or newly created PDF document. See `PdfDocument.create`/`PdfDocument.open`. */
export type PdfDocument = PdfDocumentInstance;

export const PdfDocument = {
  /** Creates a new, empty PDF document. */
  create(): PdfDocument {
    return factory.createDocument();
  },

  /**
   * Opens an existing PDF document from a file path.
   * @param password optional password for encrypted documents
   */
  open(path: string, password?: string): Promise<PdfDocument> {
    return factory.openDocument(path, password);
  },
};
