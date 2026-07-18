import type { HybridObject } from 'react-native-nitro-modules';

/**
 * An image embedded in a {@link PdfDocument} (wraps PoDoFo's
 * PdfImage/PdfXObject), obtained from
 * {@link PdfDocument.createImageFromBuffer} and drawn onto a page via
 * {@link PdfPainter.drawImage}.
 */
export interface PdfImage extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  readonly width: number;
  readonly height: number;
}
