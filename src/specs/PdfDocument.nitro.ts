import type { HybridObject } from 'react-native-nitro-modules';
import type { PdfPage } from './PdfPage.nitro';
import type { PdfFont } from './PdfFont.nitro';
import type { PdfImage } from './PdfImage.nitro';
import type { PdfField } from './PdfField.nitro';

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

/**
 * Permission flags for {@link PdfDocument.setEncrypted}, matching PoDoFo's
 * own PdfPermissions bit meanings. Omitted flags default to `true`
 * (granted) — matching PoDoFo's own `PdfPermissions::Default`, which is
 * every permission granted.
 */
export interface PdfPermissions {
  /** Allow printing the document. @default true */
  print?: boolean;
  /** Allow modifying the document besides annotations/form fields/pages. @default true */
  edit?: boolean;
  /** Allow text and graphic extraction. @default true */
  copy?: boolean;
  /** Add or modify text annotations or form fields. @default true */
  editNotes?: boolean;
  /** Fill in existing form or signature fields. @default true */
  fillAndSign?: boolean;
  /** Extract text and graphics to support users with disabilities. @default true */
  accessible?: boolean;
  /** Assemble the document: insert/create/rotate/delete pages, add bookmarks. @default true */
  docAssembly?: boolean;
  /** Print a high resolution version of the document. @default true */
  highPrint?: boolean;
}

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

  /** The number of AcroForm fields in this document (0 if there's no AcroForm yet). */
  readonly fieldCount: number;

  /**
   * Returns the AcroForm field at the given 0-based index. Owned by the
   * document's AcroForm, same lifetime hazard as {@link getPage}.
   */
  getFieldAt(index: number): PdfField;

  /** Creates a new text box field, creating the document's AcroForm first if needed. */
  createTextBox(name: string): PdfField;

  /** Creates a new checkbox field, creating the document's AcroForm first if needed. */
  createCheckBox(name: string): PdfField;

  /**
   * Encrypts the document (AES-256, PDF 2.0 revision 6 — PoDoFo's own
   * default algorithm). Takes effect on the next {@link save}.
   * @param userPassword required to open the document at all; pass '' for no open password
   * @param ownerPassword required to change permissions/remove protection
   */
  setEncrypted(
    userPassword: string,
    ownerPassword: string,
    permissions?: PdfPermissions
  ): void;

  /**
   * Whether this document was loaded from (or has been set to become,
   * pending save) an encrypted file.
   */
  isEncrypted(): boolean;
}
