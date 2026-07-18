import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfFont } from './PdfFont.nitro';
import type { PdfImage } from './PdfImage.nitro';

/**
 * Draws text and simple shapes onto a {@link PdfPage} — wraps PoDoFo's
 * PdfPainter. Only a basic slice of the C++ API is bound so far:
 * lines/rectangles/circles, RGB stroking/non-stroking color, and text drawn
 * with a {@link PdfFont}. {@link finishDrawing} must be called once drawing
 * is complete — matches PoDoFo's own contract that a painting session has
 * to be explicitly finished before the page's content stream is valid.
 */
export interface PdfPainter extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  /**
   * Sets the font and size used by subsequent {@link drawText} calls. Must
   * be called at least once before drawing any text.
   */
  setFont(font: PdfFont, fontSize: number): void;

  /** Draws a single line of text. {@link setFont} must be called first. */
  drawText(text: string, x: number, y: number): void;

  /** Draws an image, scaled by the given factors (default: natural size). */
  drawImage(
    image: PdfImage,
    x: number,
    y: number,
    scaleX?: number,
    scaleY?: number
  ): void;

  /** Strokes a line with the current stroking color and line settings. */
  drawLine(x1: number, y1: number, x2: number, y2: number): void;

  /**
   * Draws a rectangle.
   * @param fill true to fill using the non-zero winding rule, false to
   * stroke the outline only
   */
  drawRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: boolean
  ): void;

  /**
   * Draws a circle.
   * @param fill true to fill using the non-zero winding rule, false to
   * stroke the outline only
   */
  drawCircle(x: number, y: number, radius: number, fill: boolean): void;

  /** Sets the color used for stroking (line/outline) operations. */
  setStrokingColorRGB(red: number, green: number, blue: number): void;

  /** Sets the color used for non-stroking (fill/text) operations. */
  setNonStrokingColorRGB(red: number, green: number, blue: number): void;

  /** Pushes the current graphics state (matches the PDF 'q' operator). */
  save(): void;

  /** Pops the graphics state (matches the PDF 'Q' operator). */
  restore(): void;

  /**
   * Finishes drawing onto the page. Must be called once drawing is
   * complete.
   */
  finishDrawing(): void;
}
