import { PdfView } from '@kishannareshpal/expo-pdf';
import { Button, Typography } from 'heroui-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '../src/components/LogView';
import { SaveAsButton } from '../src/components/SaveAsButton';
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
    <View className="flex-1 gap-3 p-4">
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Each tap adds 90° to page 0 via
            `page.setRotation`.
          </Typography>
          <Button onPress={rotate}>Rotate 90°</Button>
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <>
          <SaveAsButton sourcePath={path} suggestedName="rotate" />
          <PdfView
            key={reloadKey}
            className="flex-1 overflow-hidden rounded-2xl"
            uri={uri}
          />
        </>
      )}
    </View>
  );
}
