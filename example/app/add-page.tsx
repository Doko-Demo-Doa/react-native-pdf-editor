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
    <View className="flex-1 gap-3 p-4">
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
