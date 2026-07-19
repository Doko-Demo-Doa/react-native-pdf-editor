import { PdfEditorFactory } from './PdfEditorFactory';
import type {
  PdfPageBitmap,
  RenderPageOptions,
} from './specs/PdfRendering.nitro';

export type {
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
export function renderPageToBitmap(
  options: RenderPageOptions
): Promise<PdfPageBitmap> {
  return PdfEditorFactory.renderPageToBitmap(options);
}
