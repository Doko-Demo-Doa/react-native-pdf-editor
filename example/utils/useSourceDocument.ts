import * as DocumentPicker from 'expo-document-picker';
import {
  PdfDocument,
  type PdfDocument as PdfDocumentInstance,
} from 'react-native-pdf-editor';
import { create } from 'zustand';

export interface PickedDocument {
  /** The opened document, or `null` if `PdfDocument.open` threw (see `error`). */
  doc: PdfDocumentInstance | null;
  /** `PdfDocument.open`'s error, stringified, when `doc` is `null`. */
  error?: string;
  /** Stripped filesystem path - ready for `PdfDocument.open`/`save`, `PdfRenderer`, `field.verifySignature`, etc. */
  path: string;
  /** Original `file://` URI, e.g. for `<PdfView uri={...} />`. */
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  lastModified?: number;
}

interface SourceDocumentState {
  doc: PdfDocumentInstance | null;
  sourceLabel: string | null;
  loading: boolean;
  generateSample: (createSample: () => PdfDocumentInstance) => string;
  pickFile: () => Promise<PickedDocument | null>;
}

/**
 * Holds the document every example screen works against, sourced from either
 * a caller-provided sample builder or a real PDF picked from the device, so a
 * real-world file can be exercised once one is available - not just the
 * library's own synthetic output. Building the sample itself is the caller's
 * concern (each screen creates a document shaped for what it demonstrates);
 * this store only owns the resulting `doc`/`sourceLabel`/`loading` state.
 *
 * Backed by a Zustand store rather than local component state so the
 * document picked/generated on one screen (e.g. the home screen) is the same
 * one every other screen sees, instead of each screen starting from its own
 * blank slate.
 *
 * `pickFile` returns the full picked-file metadata (not just a label) so
 * screens that need more than the opened document - a raw path, size,
 * mimeType, or last-modified time - don't have to duplicate the
 * `DocumentPicker.getDocumentAsync`/`PdfDocument.open` dance themselves.
 */
export const useSourceDocument = create<SourceDocumentState>((set) => ({
  doc: null,
  sourceLabel: null,
  loading: false,

  generateSample: (createSample) => {
    set({ loading: true });
    const doc = createSample();
    const label = 'generated sample';
    set({ doc, sourceLabel: label, loading: false });
    return label;
  },

  pickFile: async () => {
    set({ loading: true });
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0]!;
      const path = asset.uri.replace(/^file:\/\//, '');
      const base = {
        path,
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        lastModified: asset.lastModified,
      };

      try {
        const opened = await PdfDocument.open(path);
        set({ doc: opened, sourceLabel: asset.name });
        return { ...base, doc: opened };
      } catch (error) {
        return { ...base, doc: null, error: String(error) };
      }
    } finally {
      set({ loading: false });
    }
  },
}));
