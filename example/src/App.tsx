import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  PdfDocument,
  renderPageToBitmap,
  type PdfPageBitmap,
} from 'react-native-pdf-editor';
import { DIGEST_ALGORITHM_OIDS } from 'react-native-pdf-editor/signing';

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

export default function App() {
  const [lines, setLines] = useState<string[]>(['Running...']);

  useEffect(() => {
    const log = (line: string) => setLines((prev) => [...prev, line]);

    (async () => {
      try {
        // 200x100pt page, white background, with a 50x50pt black square in
        // the PDF's bottom-left corner (PDF coordinate origin is
        // bottom-left) — a known ground truth to verify the renderer
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

        // Deliberately not using expo-file-system here: adding it as a
        // dependency crashed the app at launch with a dyld "Symbol not
        // found" error from a precompiled ExpoFileSystem/ExpoModulesCore
        // version mismatch, unrelated to this library — a plain temp path
        // avoids that whole side-quest for this one-off verification.
        const path = Platform.select({
          ios: '/tmp/render-test.pdf',
          default: '/data/local/tmp/render-test.pdf',
        })!;
        await doc.save(path);
        log(`Saved test PDF to ${path}`);

        const bitmap = await renderPageToBitmap({
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

        // Demonstrates the separate 'react-native-pdf-editor/signing' entry
        // point — signing-related exports live there, not on the main import.
        log(
          `SHA256 OID (from /signing entry): ${DIGEST_ALGORITHM_OIDS.SHA256}`
        );
      } catch (error) {
        log(`Error: ${String(error)}`);
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {lines.map((line, i) => (
        <Text key={i} style={styles.line}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  line: {
    marginBottom: 8,
    fontSize: 12,
  },
});
