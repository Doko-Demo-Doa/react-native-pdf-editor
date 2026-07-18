import type { HybridObject } from 'react-native-nitro-modules';

/**
 * A font usable with {@link PdfPainter.setFont}, obtained from
 * {@link PdfDocument.getStandard14Font}. Owned by its parent PdfDocument —
 * invalid once the document that created it is closed. Opaque handle, no
 * methods of its own yet (no custom/bundled font loading — see PLAN.md).
 */
export interface PdfFont extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {}
