import type { HybridObject } from 'react-native-nitro-modules';
import type {
  PdfAnnotation,
  PdfAnnotationType,
  PdfRect,
} from './PdfAnnotation.nitro';
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

  /** The page's clockwise rotation in degrees, normalized to 0/90/180/270 (from the page's /Rotate entry). */
  getRotation(): number;

  /**
   * Sets the page's rotation.
   * @param rotation clockwise degrees, must be a multiple of 90 (negative values are normalized by PoDoFo)
   */
  setRotation(rotation: number): void;

  /** The page's MediaBox (physical page size) in PDF units. */
  getMediaBox(): PdfRect;

  /** Resizes the page by setting its MediaBox. */
  setMediaBox(x: number, y: number, width: number, height: number): void;

  /** The page's CropBox (visible region) in PDF units, or the MediaBox if no CropBox is set. */
  getCropBox(): PdfRect;

  /** Sets the page's CropBox (visible region). */
  setCropBox(x: number, y: number, width: number, height: number): void;

  /**
   * Moves this page to a new 0-based index within its parent document's
   * page tree. Any {@link PdfPage} instances already obtained for other
   * pages become invalid, their indices shift, same hazard as
   * {@link PdfDocument.removePageAt}.
   * @returns true if the page was actually moved, false if it was already at `newIndex`
   */
  moveTo(newIndex: number): boolean;

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
