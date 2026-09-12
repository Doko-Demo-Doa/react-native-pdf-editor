import PagerView, { type PagerViewRef } from '@expo/ui/community/pager-view';
import * as Sharing from 'expo-sharing';
import { Button, Typography } from 'heroui-native';
import { useCallback, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { LogView } from '@/components/LogView';
import { demoPdfPath } from '@/utils/pdf';
import { renderPdfPageToPng } from '@/utils/pdfPagePreview';
import { useLog } from '@/utils/useLog';
import { useSourceDocument } from '@/utils/useSourceDocument';

const renderSourcePath = demoPdfPath('render-source').path;

export default function RenderPageExample() {
  const { lines, log } = useLog();
  const { doc } = useSourceDocument();
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rendering, setRendering] = useState(false);
  const pagerRef = useRef<PagerViewRef>(null);
  // PagerView (a native SwiftUI/Compose host, not a plain RN View) only takes
  // a `style` prop, so its Tailwind classes need resolving to a style object
  // rather than passed as `className` directly.
  const pagerStyle = useResolveClassNames('flex-1 overflow-hidden rounded-2xl');

  const render = useCallback(async () => {
    if (!doc) return;
    setRendering(true);
    try {
      await doc.save(renderSourcePath);
      const uris: string[] = [];
      for (let index = 0; index < doc.pageCount; index++) {
        const { uri } = await renderPdfPageToPng({
          path: renderSourcePath,
          pageIndex: index,
        });
        uris.push(uri);
      }
      setPageImages(uris);
      setCurrentPage(0);
      pagerRef.current?.setPageWithoutAnimation(0);
      log(`Rendered ${uris.length} page${uris.length === 1 ? '' : 's'}`);
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setRendering(false);
    }
  }, [doc, log]);

  const saveCurrentPage = useCallback(async () => {
    const uri = pageImages[currentPage];
    if (!uri) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    }
  }, [pageImages, currentPage]);

  return (
    <View className="flex-1 gap-3 bg-background p-4">
      <Typography type="body-sm" color="muted">
        Render the picked/generated PDF. Use swipe gestures to navigate between
        pages, and tap "Save page" to share the currently visible page as a PNG
        image.
      </Typography>

      <Button onPress={render} isDisabled={!doc || rendering}>
        {rendering ? 'Rendering...' : 'Render'}
      </Button>

      {pageImages.length > 0 && (
        <>
          <PagerView
            ref={pagerRef}
            style={pagerStyle}
            onPageSelected={(event) =>
              setCurrentPage(event.nativeEvent.position)
            }
          >
            {pageImages.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                className="flex-1"
                resizeMode="contain"
              />
            ))}
          </PagerView>

          <Button variant="outline" onPress={saveCurrentPage}>
            Save page {currentPage + 1}
          </Button>
        </>
      )}

      <LogView lines={lines} />
    </View>
  );
}
