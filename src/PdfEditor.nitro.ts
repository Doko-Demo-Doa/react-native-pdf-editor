import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfDocument } from './PdfDocument.nitro';

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
}
