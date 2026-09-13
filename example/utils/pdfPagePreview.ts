import { Directory, File, Paths } from 'expo-file-system';
import { PdfRenderer } from 'react-native-pdf-editor';

const previewsDir = new Directory(Paths.cache, 'pdf-page-previews');

/**
 * Rasterizes one page of a saved-to-disk PDF to a cached PNG, for display in
 * an `<Image>` (e.g. a page pager or a signature-placement preview). Shared
 * by `render-page.tsx` and `SignatureAssemblerModal` so both go through the
 * same `PdfRenderer.renderPageToBitmap`/`writeBitmapToImage` dance instead of
 * duplicating it.
 */
export async function renderPdfPageToPng(options: {
  /** Path to the PDF, already saved to disk (not the in-memory `PdfDocument`). */
  path: string;
  pageIndex: number;
  /** Pixels per PDF point (72 points = 1 inch). @default 1 */
  scale?: number;
}): Promise<{ path: string; uri: string }> {
  const { path, pageIndex, scale = 1 } = options;

  if (!previewsDir.exists) {
    previewsDir.create();
  }
  const file = new File(previewsDir, `page-${pageIndex}.png`);
  if (file.exists) {
    file.delete();
  }
  const outputPath = file.uri.replace(/^file:\/\//, '');

  const bitmap = await PdfRenderer.renderPageToBitmap({
    path,
    pageIndex,
    scale,
  });
  await PdfRenderer.writeBitmapToImage(bitmap, {
    outputPath,
    format: 'png',
  });

  return { path: outputPath, uri: file.uri };
}
