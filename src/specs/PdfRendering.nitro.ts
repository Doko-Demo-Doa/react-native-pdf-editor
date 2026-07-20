/**
 * PoDoFo does not rasterize PDFs — this is a separate native path per
 * platform: Core Graphics (`CGPDFDocument`/`CGPDFPage`) on iOS,
 * `android.graphics.pdf.PdfRenderer` on Android. Operates on a file path
 * (like signing), not the in-memory `PdfDocument`/`PdfPage` object model —
 * `save()` first if you've made in-memory edits you want reflected.
 */
export interface PdfPageBitmap {
  /**
   * Raw pixel data, `height * bytesPerRow` bytes, row-major, top-to-bottom,
   * left-to-right, premultiplied alpha (page is rendered opaque over a white background, so this rarely matters), 8 bits per channel.
   */
  data: ArrayBuffer;
  width: number;
  height: number;
  /** Usually `width * 4` for RGBA8888, but may be larger due to platform row alignment — always use this, not `width * 4`, to index into `data`. */
  bytesPerRow: number;
  /**
   * Always `'RGBA8888'` today — a plain `string`, not a union, because
   * Nitrogen's codegen can't represent a single-member string union
   * unambiguously (it can't tell a 1-value union from a plain string).
   */
  format: string;
}

export interface RenderPageOptions {
  /** Path to the PDF file to render from. */
  path: string;
  /** 0-based page index. */
  pageIndex: number;
  /** Pixels per PDF point (72 points = 1 inch). @default 1 */
  scale?: number;
}

/** Image container format for {@link PdfRenderer.writeBitmapToImage}. */
export type PdfBitmapImageFormat = 'png' | 'jpeg';
