import { PdfView } from '@kishannareshpal/expo-pdf';
import { Button, Typography } from '../src/components/ui';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '../src/components/LogView';
import { SaveAsButton } from '../src/components/SaveAsButton';
import { SourcePicker } from '../src/components/SourcePicker';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';
import { layoutStyles } from '../src/styles';

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
    <View style={layoutStyles.screen}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Each tap draws another line onto page 0 with
            `PdfPainter.drawText`.
          </Typography>
          <Button onPress={addText}>Add text</Button>
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <>
          <SaveAsButton sourcePath={path} suggestedName="add-text" />
          <PdfView key={reloadKey} style={layoutStyles.pdfView} uri={uri} />
        </>
      )}
    </View>
  );
}
