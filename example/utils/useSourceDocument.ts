import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import {
  PdfDocument,
  type PdfDocument as PdfDocumentInstance,
} from 'react-native-pdf-editor';

/**
 * Lets each example start from either a freshly-generated sample document or
 * a real PDF picked from the device, so a real-world file can be exercised
 * once one is available - not just the library's own synthetic output.
 */
export function useSourceDocument(createSample: () => PdfDocumentInstance) {
  const [doc, setDoc] = useState<PdfDocumentInstance | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const useSample = useCallback(() => {
    setDoc(createSample());
    setSourceLabel('generated sample');
  }, [createSample]);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0]!;
    const opened = await PdfDocument.open(asset.uri.replace(/^file:\/\//, ''));
    setDoc(opened);
    setSourceLabel(asset.name);
  }, []);

  return { doc, sourceLabel, useSample, pickFile };
}
