import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfAnnotation, PdfAnnotationType } from './PdfAnnotation.nitro';
import type { PdfPainter } from './PdfPainter.nitro';

/** A single piece of text extracted from a page, mirroring PoDoFo's own PdfTextEntry struct. */
export interface PdfTextEntry {
  text: string;
  /** Position, in PDF page coordinates (origin bottom-left). */
  x: number;
  y: number;
  /** Approximate length of the text run, in PDF units. */
  length: number;
}

export interface PdfPage extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  /** The page width in PDF units (from the page's MediaBox rect). */
  readonly width: number;

  /** The page height in PDF units (from the page's MediaBox rect). */
  readonly height: number;

  /** The 0-based index of this page within its document. */
  readonly index: number;

  /** Creates a painter bound to this page, ready to draw. */
  createPainter(): PdfPainter;

  /** The number of annotations on this page. */
  getAnnotationCount(): number;

  /**
   * Returns the annotation at the given 0-based index. Owned by this page's
   * annotation collection, same lifetime hazard as
   * {@link PdfDocument.getPage}.
   */
  getAnnotationAt(index: number): PdfAnnotation;

  /** Creates a new annotation on this page. */
  createAnnotation(
    annotationType: PdfAnnotationType,
    x: number,
    y: number,
    width: number,
    height: number
  ): PdfAnnotation;

  /**
   * Extracts text from this page, in PDF content-stream order (not
   * necessarily reading order for complex layouts).
   * @param pattern an ECMAScript-flavor regex pattern to filter matches — if
   * omitted, all text on the page is returned.
   */
  extractText(pattern?: string): PdfTextEntry[];
}
