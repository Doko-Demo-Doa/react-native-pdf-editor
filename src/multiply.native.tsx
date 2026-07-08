import { NitroModules } from 'react-native-nitro-modules';
import type { PdfEditor } from './PdfEditor.nitro';

const PdfEditorHybridObject =
  NitroModules.createHybridObject<PdfEditor>('PdfEditor');

export function multiply(a: number, b: number): number {
  return PdfEditorHybridObject.multiply(a, b);
}
