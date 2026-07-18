import { NitroModules } from 'react-native-nitro-modules';
import type { PdfEditor } from './specs/PdfEditor.nitro';

/** Shared singleton entry-point HybridObject — a factory for PdfDocument/PdfSigningSession instances. */
export const PdfEditorFactory =
  NitroModules.createHybridObject<PdfEditor>('PdfEditor');
