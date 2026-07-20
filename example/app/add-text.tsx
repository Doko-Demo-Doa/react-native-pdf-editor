import { PdfView } from '@kishannareshpal/expo-pdf';
import { useCallback, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '../src/components/LogView';
import { SourcePicker } from '../src/components/SourcePicker';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';

const { path, uri } = demoPdfPath('add-text');

function createSample() {
  const doc = PdfDocument.create();
  doc.createPage(612, 792);
  return doc;
}

export default function AddTextExample() {
  const { lines, log } = useLog();
  const [reloadKey, setReloadKey] = useState(0);
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);
  const lineCountRef = useRef(0);

  const addText = useCallback(async () => {
    if (!doc) return;
    const page = doc.getPage(0);
    const painter = page.createPainter();
    const font = doc.getStandard14Font('Helvetica');
    painter.setFont(font, 18);
    const y = page.height - 60 - lineCountRef.current * 24;
    painter.drawText(
      `Line ${lineCountRef.current + 1}, drawn at y=${y}`,
      50,
      y
    );
    painter.finishDrawing();
    lineCountRef.current += 1;

    await doc.save(path);
    log(`Drew line ${lineCountRef.current}`);
    setReloadKey((k) => k + 1);
  }, [doc, log]);

  return (
    <View style={styles.container}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Text style={styles.description}>
            Source: {sourceLabel}. Each tap draws another line onto page 0 with
            `PdfPainter.drawText`.
          </Text>
          <Button title="Add text" onPress={addText} />
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <PdfView key={reloadKey} style={styles.preview} uri={uri} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  preview: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
