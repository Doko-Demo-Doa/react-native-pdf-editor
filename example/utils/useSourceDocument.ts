import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import {
  PdfDocument,
  type PdfDocument as PdfDocumentInstance,
} from 'react-native-pdf-editor';

/**
 * Holds the document each example works against, sourced from either a
 * caller-provided sample builder or a real PDF picked from the device, so a
 * real-world file can be exercised once one is available - not just the
 * library's own synthetic output. Building the sample itself is the caller's
 * concern (each screen creates a document shaped for what it demonstrates);
 * this hook only owns the resulting `doc`/`sourceLabel`/`loading` state.
 */
export function useSourceDocument() {
  const [doc, setDoc] = useState<PdfDocumentInstance | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSample = useCallback(
    (createSample: () => PdfDocumentInstance) => {
      setLoading(true);
      setDoc(createSample());
      const label = 'generated sample';
      setSourceLabel(label);
      setLoading(false);
      return label;
    },
    []
  );

  const pickFile = useCallback(async () => {
    setLoading(true);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      setLoading(false);
      return null;
    }
    const asset = result.assets[0]!;
    const opened = await PdfDocument.open(asset.uri.replace(/^file:\/\//, ''));
    setDoc(opened);
    setSourceLabel(asset.name);
    setLoading(false);
    return asset.name;
  }, []);

  return { doc, sourceLabel, generateSample, pickFile, loading };
}
