import type { HybridObject } from 'react-native-nitro-modules';

/** Matches PoDoFo's own PdfAnnotationType names. */
export type PdfAnnotationType =
  | 'Unknown'
  | 'Text'
  | 'Link'
  | 'FreeText'
  | 'Line'
  | 'Square'
  | 'Circle'
  | 'Polygon'
  | 'PolyLine'
  | 'Highlight'
  | 'Underline'
  | 'Squiggly'
  | 'StrikeOut'
  | 'Stamp'
  | 'Caret'
  | 'Ink'
  | 'Popup'
  | 'FileAttachment'
  | 'Sound'
  | 'Movie'
  | 'Widget'
  | 'Screen'
  | 'PrinterMark'
  | 'TrapNet'
  | 'Watermark'
  | '3D'
  | 'RichMedia'
  | 'WebMedia'
  | 'Redact'
  | 'Projection';

export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A single annotation on a {@link PdfPage} (text note, link, highlight,
 * square, line, etc.) — wraps PoDoFo's PdfAnnotation base class. Only the
 * base API (position/size, contents, type) is bound so far, not
 * type-specific behavior (e.g. a Line annotation's endpoints, a Link's
 * destination).
 *
 * Owned by its parent page's annotation collection — no public
 * constructor, invalid once the owning document is closed.
 */
export interface PdfAnnotation extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  readonly annotationType: PdfAnnotationType;

  getRect(): PdfRect;
  setRect(x: number, y: number, width: number, height: number): void;

  /** The annotation's text content (e.g. a sticky note's body), if set. */
  getContents(): string | undefined;
  setContents(contents: string | undefined): void;
}
