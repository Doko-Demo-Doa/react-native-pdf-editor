import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button, Input, Label, TextField, Typography } from 'heroui-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
  PdfDocument,
  PdfRenderer,
  type PdfBitmapImageFormat,
} from 'react-native-pdf-editor';

import { LogView } from '@/components/LogView';
import { layoutStyles } from '@/styles';
import { demoPdfPath } from '@/utils/pdf';
import { useLog } from '@/utils/useLog';
import { useSourceDocument } from '@/utils/useSourceDocument';

const samplePath = demoPdfPath('render-source').path;
const imageExportsDir = new Directory(Paths.cache, 'rendered-pages');

function getImageExportPath(filename: string, format: PdfBitmapImageFormat) {
  if (!imageExportsDir.exists) {
    imageExportsDir.create();
  }
  const safeName = filename.trim().replace(/[/\\]/g, '_') || 'rendered-page';
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const lowerName = safeName.toLowerCase();
  const hasExtension =
    format === 'jpeg'
      ? lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')
      : lowerName.endsWith('.png');
  const withExtension = hasExtension ? safeName : `${safeName}.${extension}`;
  const destination = new File(imageExportsDir, withExtension);
  if (destination.exists) {
    destination.delete();
  }
  return {
    path: destination.uri.replace(/^file:\/\//, ''),
    uri: destination.uri,
  };
}

function createSample() {
  const doc = PdfDocument.create();
  const page1 = doc.createPage(612, 792);
  const painter1 = page1.createPainter();
  const font = doc.getStandard14Font('HelveticaBold');
  painter1.setFont(font, 36);
  painter1.drawText('Rendered page 0', 72, 700);
  painter1.setNonStrokingColorRGB(0.1, 0.45, 0.9);
  painter1.drawRectangle(72, 560, 240, 100, true);
  painter1.finishDrawing();

  const page2 = doc.createPage(612, 792);
  const painter2 = page2.createPainter();
  painter2.setFont(font, 36);
  painter2.drawText('Rendered page 1', 72, 700);
  painter2.setStrokingColorRGB(0.9, 0.2, 0.1);
  painter2.drawCircle(180, 560, 60, false);
  painter2.drawLine(72, 460, 360, 620);
  painter2.finishDrawing();

  return doc;
}

export default function RenderPageExample() {
  const { lines, log } = useLog();
  const { sourceLabel, generateSample, pickFile } = useSourceDocument();
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState('0');
  const [filename, setFilename] = useState('rendered-page');
  const [imageFormat, setImageFormat] = useState<PdfBitmapImageFormat>('png');
  const [rendering, setRendering] = useState(false);

  const useSample = useCallback(async () => {
    const sample = createSample();
    await sample.save(samplePath);
    generateSample(() => sample);
    setSourcePath(samplePath);
    setPageCount(sample.pageCount);
    log(`Loaded generated sample (${sample.pageCount} pages)`);
  }, [generateSample, log]);

  const pickAndLoad = useCallback(async () => {
    const picked = await pickFile();
    if (!picked?.doc) return;
    setSourcePath(picked.path);
    setPageCount(picked.doc.pageCount);
    log(`Loaded ${picked.name} (${picked.doc.pageCount} pages)`);
  }, [pickFile, log]);

  const renderAndShare = useCallback(async () => {
    if (!sourcePath || pageCount === null) return;
    const index = Number.parseInt(pageIndex, 10);
    if (!Number.isInteger(index) || index < 0 || index >= pageCount) {
      log(`Enter a page index from 0 to ${pageCount - 1}`);
      return;
    }

    setRendering(true);
    try {
      const bitmap = await PdfRenderer.renderPageToBitmap({
        path: sourcePath,
        pageIndex: index,
        scale: 2,
      });
      const { path, uri } = getImageExportPath(filename, imageFormat);
      await PdfRenderer.writeBitmapToImage(bitmap, {
        outputPath: path,
        format: imageFormat,
      });
      log(
        `Rendered page ${index} to ${bitmap.width}x${bitmap.height} ${imageFormat.toUpperCase()}`
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
          UTI: imageFormat === 'jpeg' ? 'public.jpeg' : 'public.png',
        });
      }
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setRendering(false);
    }
  }, [filename, imageFormat, log, pageCount, pageIndex, sourcePath]);

  return (
    <View style={layoutStyles.screen}>
      <View style={layoutStyles.stack}>
        <Typography type="body-sm" color="muted">
          Pick a PDF, choose a 0-based page index, render it, then save/share
          the PNG through the system sheet.
        </Typography>
        <Button variant="secondary" onPress={useSample}>
          Generate sample document
        </Button>
        <Button variant="outline" onPress={pickAndLoad}>
          Pick a PDF file
        </Button>
      </View>

      {sourcePath && (
        <View style={layoutStyles.stack}>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Pages: {pageCount}
          </Typography>
          <TextField>
            <Label>Page index</Label>
            <Input
              value={pageIndex}
              onChangeText={setPageIndex}
              keyboardType="number-pad"
              placeholder="0"
            />
          </TextField>
          <TextField>
            <Label>Image file name</Label>
            <Input
              value={filename}
              onChangeText={setFilename}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="rendered-page"
            />
          </TextField>
          <View style={layoutStyles.row}>
            <Button
              className="flex-1"
              variant={imageFormat === 'png' ? 'primary' : 'outline'}
              onPress={() => setImageFormat('png')}
            >
              PNG
            </Button>
            <Button
              className="flex-1"
              variant={imageFormat === 'jpeg' ? 'primary' : 'outline'}
              onPress={() => setImageFormat('jpeg')}
            >
              JPEG
            </Button>
          </View>
          <Button onPress={renderAndShare} isDisabled={rendering}>
            {rendering ? 'Rendering...' : 'Render and save image'}
          </Button>
        </View>
      )}

      <LogView lines={lines} />
    </View>
  );
}
