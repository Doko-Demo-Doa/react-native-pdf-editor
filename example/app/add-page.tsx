import { PdfView } from '@kishannareshpal/expo-pdf';
import { Button, Typography } from '@/components/ui';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '@/components/LogView';
import { SaveAsButton } from '@/components/SaveAsButton';
import { SourcePicker } from '@/components/SourcePicker';
import { demoPdfPath } from '@/utils/pdf';
import { useLog } from '@/utils/useLog';
import { useSourceDocument } from '@/utils/useSourceDocument';
import { layoutStyles } from '@/styles';

const { path, uri } = demoPdfPath('add-page');

function createSample() {
  const doc = PdfDocument.create();
  doc.createPage(612, 792);
  return doc;
}

export default function AddPageExample() {
  const { lines, log } = useLog();
  const [reloadKey, setReloadKey] = useState(0);
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);

  const addPage = useCallback(async () => {
    if (!doc) return;
    doc.createPage(612, 792);
    await doc.save(path);
    log(`Page count: ${doc.pageCount}`);
    setReloadKey((k) => k + 1);
  }, [doc, log]);

  return (
    <View style={layoutStyles.screen}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Each tap appends a new 612x792 page with
            `doc.createPage(width, height)` and re-saves.
          </Typography>
          <Button onPress={addPage}>Add page</Button>
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <>
          <SaveAsButton sourcePath={path} suggestedName="add-page" />
          <PdfView key={reloadKey} style={layoutStyles.pdfView} uri={uri} />
        </>
      )}
    </View>
  );
}
