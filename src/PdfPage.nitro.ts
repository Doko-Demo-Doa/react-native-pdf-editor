import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfAnnotation, PdfAnnotationType } from './PdfAnnotation.nitro';
import type { PdfPainter } from './PdfPainter.nitro';

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
}
