import { PdfView } from '@kishannareshpal/expo-pdf';
import { useCallback, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '../src/components/LogView';
import { SourcePicker } from '../src/components/SourcePicker';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';

const { path, uri } = demoPdfPath('rotate');

function createSample() {
  const doc = PdfDocument.create();
  const page = doc.createPage(400, 300);
  const painter = page.createPainter();
  painter.setNonStrokingColorRGB(1, 1, 1);
  painter.drawRectangle(0, 0, 400, 300, true);
  // A black square in the top-left corner and a label, so a 90 rotation is
  // visually unambiguous in the preview below.
  painter.setNonStrokingColorRGB(0, 0, 0);
  painter.drawRectangle(0, 250, 60, 50, true);
  const font = doc.getStandard14Font('Helvetica');
  painter.setFont(font, 16);
  painter.drawText('TOP-LEFT square marks orientation', 20, 150);
  painter.finishDrawing();
  return doc;
}

export default function RotateExample() {
  const { lines, log } = useLog();
  const [reloadKey, setReloadKey] = useState(0);
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);

  const rotate = useCallback(async () => {
    if (!doc) return;
    const page = doc.getPage(0);
    const newRotation = (page.getRotation() + 90) % 360;
    page.setRotation(newRotation);
    await doc.save(path);
    log(`Rotation: ${newRotation}°`);
    setReloadKey((k) => k + 1);
  }, [doc, log]);

  return (
    <View style={styles.container}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Text style={styles.description}>
            Source: {sourceLabel}. Each tap adds 90° to page 0 via
            `page.setRotation`.
          </Text>
          <Button title="Rotate 90°" onPress={rotate} />
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
