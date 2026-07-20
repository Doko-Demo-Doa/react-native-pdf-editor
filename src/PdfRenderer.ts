import { PdfEditorFactory } from './PdfEditorFactory';
import type {
  PdfBitmapImageFormat,
  PdfPageBitmap,
  RenderPageOptions,
} from './specs/PdfRendering.nitro';

export type {
  PdfBitmapImageFormat,
  PdfPageBitmap,
  RenderPageOptions,
} from './specs/PdfRendering.nitro';

/**
 * Rasterizes a page from a PDF file to an RGBA8888 bitmap. PoDoFo doesn't
 * rasterize PDFs — this uses Core Graphics (iOS) /
 * `android.graphics.pdf.PdfRenderer` (Android) directly against the file at
 * `options.path`, not the in-memory `PdfDocument`/`PdfPage` object model —
 * `save()` first if you have unsaved edits you want reflected.
 */
function renderPageToBitmap(
  options: RenderPageOptions
): Promise<PdfPageBitmap> {
  return PdfEditorFactory.renderPageToBitmap(options);
}

function writeBitmapToImage(
  bitmap: PdfPageBitmap,
  outputPath: string,
  format: PdfBitmapImageFormat
): Promise<void> {
  return PdfEditorFactory.writeBitmapToImage(bitmap, outputPath, format);
}

/**
 * Renders saved PDF files to bitmap data.
 *
 * `PdfRenderer` operates on files on disk, not in-memory document or page
 * objects. Save a document before rendering when unsaved edits should appear
 * in the bitmap.
 *
 * @see {@linkcode PdfRenderer.renderPageToBitmap}
 */
export const PdfRenderer = {
  /** Rasterizes a PDF page to an RGBA8888 bitmap. */
  renderPageToBitmap,
  /** Encodes an RGBA8888 bitmap to an image file. */
  writeBitmapToImage,
};
