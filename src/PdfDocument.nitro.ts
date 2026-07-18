import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfPage } from './PdfPage.nitro';
import type { PdfFont } from './PdfFont.nitro';
import type { PdfImage } from './PdfImage.nitro';

/**
 * One of the 14 PDF "standard" fonts (Helvetica, Times, Courier, Symbol,
 * ZapfDingbats and their bold/italic variants) — always renderable by any
 * PDF viewer, no font embedding needed. Matches PoDoFo's own
 * PdfStandard14FontType names.
 */
export type Standard14FontName =
  | 'TimesRoman'
  | 'TimesItalic'
  | 'TimesBold'
  | 'TimesBoldItalic'
  | 'Helvetica'
  | 'HelveticaOblique'
  | 'HelveticaBold'
  | 'HelveticaBoldOblique'
  | 'Courier'
  | 'CourierOblique'
  | 'CourierBold'
  | 'CourierBoldOblique'
  | 'Symbol'
  | 'ZapfDingbats';

export interface PdfDocument extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  /** The number of pages in this document. */
  readonly pageCount: number;

  /**
   * Returns the page at the given 0-based index. The returned {@link PdfPage}
   * is owned by this document's page tree — it becomes invalid once this
   * document is closed.
   */
  getPage(index: number): PdfPage;

  /** Creates a new page and appends it to the end of the document. */
  createPage(width: number, height: number): PdfPage;

  /**
   * Removes the page at the given 0-based index. Any {@link PdfPage}
   * instances already obtained for later pages become invalid — indices
   * shift after removal, matching PoDoFo's own C++ semantics.
   */
  removePageAt(index: number): void;

  /** Gets one of the 14 PDF standard fonts, for use with a painter. */
  getStandard14Font(name: Standard14FontName): PdfFont;

  /**
   * Decodes an encoded image (JPEG/PNG/etc.) from a buffer and embeds it in
   * the document, ready to be drawn onto a page via a painter.
   */
  createImageFromBuffer(data: ArrayBuffer): PdfImage;

  /** Saves the complete document to a file. */
  save(path: string): Promise<void>;

  getTitle(): string | undefined;
  setTitle(title: string | undefined): void;

  getAuthor(): string | undefined;
  setAuthor(author: string | undefined): void;

  getSubject(): string | undefined;
  setSubject(subject: string | undefined): void;

  getCreator(): string | undefined;
  setCreator(creator: string | undefined): void;
}
