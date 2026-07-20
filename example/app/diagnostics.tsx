import { Typography } from 'heroui-native';
import { useEffect } from 'react';
import { Platform, ScrollView } from 'react-native';
import {
  PdfDocument,
  PdfRenderer,
  type PdfPageBitmap,
} from 'react-native-pdf-editor';
import { DIGEST_ALGORITHM_OIDS } from 'react-native-pdf-editor/signing';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';

function readPixel(bitmap: PdfPageBitmap, x: number, y: number) {
  const bytes = new Uint8Array(bitmap.data);
  const offset = y * bitmap.bytesPerRow + x * 4;
  return {
    r: bytes[offset] ?? 0,
    g: bytes[offset + 1] ?? 0,
    b: bytes[offset + 2] ?? 0,
    a: bytes[offset + 3] ?? 0,
  };
}

/** Whether any pixel in the given rectangle is non-white - a cheap "some ink was drawn here" check. */
function regionHasInk(
  bitmap: PdfPageBitmap,
  x: number,
  y: number,
  width: number,
  height: number
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const p = readPixel(bitmap, x + dx, y + dy);
      if (p.r < 235 || p.g < 235 || p.b < 235) return true;
    }
  }
  return false;
}

export default function Diagnostics() {
  const { lines, log } = useLog();

  useEffect(() => {
    (async () => {
      try {
        // 200x100pt page, white background, with a 50x50pt black square in
        // the PDF's bottom-left corner (PDF coordinate origin is
        // bottom-left) - a known ground truth to verify the renderer
        // actually produces a top-down RGBA bitmap with the right
        // orientation and color channel order, not just "compiles".
        const doc = PdfDocument.create();
        const page = doc.createPage(200, 100);
        const painter = page.createPainter();
        painter.setNonStrokingColorRGB(1, 1, 1);
        painter.drawRectangle(0, 0, 200, 100, true);
        painter.setNonStrokingColorRGB(0, 0, 0);
        painter.drawRectangle(0, 0, 50, 50, true);
        painter.finishDrawing();

        const { path } = demoPdfPath('diagnostics');
        await doc.save(path);
        log(`Saved test PDF to ${path}`);

        const bitmap = await PdfRenderer.renderPageToBitmap({
          path,
          pageIndex: 0,
          scale: 1,
        });
        log(
          `Bitmap: ${bitmap.width}x${bitmap.height}, bytesPerRow=${bitmap.bytesPerRow}, format=${bitmap.format}`
        );

        // Bottom-left of the PDF (the black square) should land at the
        // BOTTOM-LEFT of the top-down bitmap, i.e. near the last row.
        const bottomLeft = readPixel(bitmap, 10, bitmap.height - 10);
        // Top-right of the PDF (white) should land at the TOP-RIGHT of the
        // top-down bitmap, i.e. near row 0.
        const topRight = readPixel(bitmap, bitmap.width - 10, 10);
        // Top-left of the PDF (white, outside the black square) should land
        // at the top-left of the bitmap.
        const topLeft = readPixel(bitmap, 10, 10);

        log(`bottomLeft pixel (expect ~black): ${JSON.stringify(bottomLeft)}`);
        log(`topRight pixel (expect white): ${JSON.stringify(topRight)}`);
        log(`topLeft pixel (expect white): ${JSON.stringify(topLeft)}`);

        const isBlack =
          bottomLeft.r < 20 && bottomLeft.g < 20 && bottomLeft.b < 20;
        const isWhiteTR =
          topRight.r > 235 && topRight.g > 235 && topRight.b > 235;
        const isWhiteTL = topLeft.r > 235 && topLeft.g > 235 && topLeft.b > 235;
        log(
          isBlack && isWhiteTR && isWhiteTL
            ? '✅ PASS: rendering orientation + color channels correct'
            : '❌ FAIL: rendering orientation or color channels wrong'
        );

        const text = page.extractText();
        log(`extractText(): ${JSON.stringify(text)}`);

        // Custom/embedded TTF font loading - see PdfDocument.loadFont. Uses
        // a real on-device system font file as a stand-in for a bundled
        // custom font; apps would ship their own TTF asset instead.
        const fontPath = Platform.select({
          ios: '/System/Library/Fonts/Supplemental/Arial.ttf',
          default: '/system/fonts/Roboto-Regular.ttf',
        })!;
        const customFont = doc.loadFont(fontPath);
        const page2 = doc.createPage(200, 100);
        const painter2 = page2.createPainter();
        painter2.setNonStrokingColorRGB(1, 1, 1);
        painter2.drawRectangle(0, 0, 200, 100, true);
        painter2.setNonStrokingColorRGB(0, 0, 0);
        painter2.setFont(customFont, 24);
        painter2.drawText('Custom font!', 10, 50);
        painter2.finishDrawing();
        await doc.save(path);
        log(`loadFont(${fontPath}) succeeded, drew text with it`);

        const bitmap2 = await PdfRenderer.renderPageToBitmap({
          path,
          pageIndex: 1,
          scale: 1,
        });
        // Scan a generous box around the text baseline (24pt font, drawn at
        // x=10/y=50 in PDF space) rather than one exact pixel - glyph
        // shapes differ between Arial (iOS) and Roboto (Android).
        const hasInk = regionHasInk(bitmap2, 5, 25, 100, 40);
        log(
          hasInk
            ? '✅ PASS: custom font text rendered (non-white ink found)'
            : '❌ FAIL: expected ink near custom font text, found none'
        );

        // Demonstrates the separate 'react-native-pdf-editor/signing' entry
        // point - signing-related exports live there, not on the main import.
        log(
          `SHA256 OID (from /signing entry): ${DIGEST_ALGORITHM_OIDS.SHA256}`
        );
      } catch (error) {
        log(`Error: ${String(error)}`);
      }
    })();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- log() is stable (from useLog, never changes identity), and this must run once on mount only
  }, []);

  return (
    <ScrollView contentContainerClassName="gap-2 p-5">
      {lines.map((line, i) => (
        <Typography key={i} type="body-xs">
          {line}
        </Typography>
      ))}
    </ScrollView>
  );
}
