import type { PdfDocument } from 'react-native-pdf-editor';

import { Button, Typography } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { SignatureImageState } from '@/components/sign/SignatureStyleMenu';

import { demoPdfPath } from '@/utils/pdf';
import { renderPdfPageToPng } from '@/utils/pdfPagePreview';

export interface SignaturePlacement {
  pageIndex: number;
  /** PDF points, bottom-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_PREVIEW_HEIGHT_RATIO = 0.55;
const DEFAULT_WIDTH_RATIO = 0.3;
const MIN_BOX_WIDTH_PX = 40;
const MIN_PAGE_SCALE = 1;
const MAX_PAGE_SCALE = 4;

const { path: assemblerPreviewPath } = demoPdfPath('sign-assembler-preview');

function signatureImageSource(image: SignatureImageState): { uri: string } {
  return {
    uri: image.base64
      ? `data:image/png;base64,${image.base64}`
      : `file://${image.path}`,
  };
}

function fitContain(
  containerWidth: number,
  maxHeight: number,
  aspectRatio: number
) {
  const widthConstrained = {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  };
  if (widthConstrained.height <= maxHeight) return widthConstrained;
  return { width: maxHeight * aspectRatio, height: maxHeight };
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export interface SignatureAssemblerModalProps {
  visible: boolean;
  doc: PdfDocument;
  pageIndex: number;
  signatureImage: SignatureImageState;
  initialPlacement?: SignaturePlacement | null;
  onCancel: () => void;
  onConfirm: (placement: SignaturePlacement) => void;
}

export function SignatureAssemblerModal({
  visible,
  doc,
  pageIndex,
  signatureImage,
  initialPlacement,
  onCancel,
  onConfirm,
}: SignatureAssemblerModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [pagePreviewUri, setPagePreviewUri] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const source = useMemo(
    () => signatureImageSource(signatureImage),
    [signatureImage]
  );

  useEffect(() => {
    if (!visible) return;
    setPagePreviewUri(null);
    setError(null);
    (async () => {
      try {
        await doc.save(assemblerPreviewPath);
        const { uri } = await renderPdfPageToPng({
          path: assemblerPreviewPath,
          pageIndex,
        });
        setPagePreviewUri(uri);
      } catch (cause) {
        setError(String(cause));
      }
    })();
  }, [visible, doc, pageIndex]);

  useEffect(() => {
    if (!visible) return;
    setImageAspectRatio(null);
    Image.getSize(
      source.uri,
      (width, height) => setImageAspectRatio(width / height),
      () => setImageAspectRatio(210 / 72)
    );
  }, [visible, source]);

  const page = doc.getPage(pageIndex);
  const pageWidthPt = page.width;
  const pageHeightPt = page.height;
  const pageAspectRatio = pageWidthPt / pageHeightPt;
  const maxHeight = windowHeight * MAX_PREVIEW_HEIGHT_RATIO;

  const displayed = useMemo(() => {
    if (!containerWidth) return null;
    return fitContain(containerWidth, maxHeight, pageAspectRatio);
  }, [containerWidth, maxHeight, pageAspectRatio]);

  const pointsPerPixel = displayed ? pageWidthPt / displayed.width : 1;

  const ready = displayed && pagePreviewUri && imageAspectRatio;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center bg-black/50 p-4">
        <View className="gap-3 rounded-2xl bg-white p-4">
          <Typography type="h6">Position your signature</Typography>
          <Typography type="body-sm" color="muted">
            Drag or pinch the dashed box to place your signature. Drag/pinch
            elsewhere on the page to pan and zoom it. Places it on page{' '}
            {pageIndex + 1}.
          </Typography>

          {error && (
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
          )}

          <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {ready && (
              <SignatureAssembler
                key={`${pageIndex}-${pagePreviewUri}`}
                pagePreviewUri={pagePreviewUri}
                displayed={displayed}
                imageAspectRatio={imageAspectRatio}
                source={source}
                initialPlacement={initialPlacement ?? undefined}
                pointsPerPixel={pointsPerPixel}
                pageHeightPt={pageHeightPt}
                onCancel={onCancel}
                onConfirm={(placement) =>
                  onConfirm({ ...placement, pageIndex })
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Split out from the modal shell so `key={pageIndex-pagePreviewUri}` above
 * fully remounts it (and its shared values) whenever the target page or
 * preview image changes, instead of trying to reconcile stale gesture state.
 */
function SignatureAssembler({
  pagePreviewUri,
  displayed,
  imageAspectRatio,
  source,
  initialPlacement,
  pointsPerPixel,
  pageHeightPt,
  onCancel,
  onConfirm,
}: {
  pagePreviewUri: string;
  displayed: { width: number; height: number };
  imageAspectRatio: number;
  source: { uri: string };
  initialPlacement?: SignaturePlacement;
  pointsPerPixel: number;
  pageHeightPt: number;
  onCancel: () => void;
  onConfirm: (placement: Omit<SignaturePlacement, 'pageIndex'>) => void;
}) {
  const initialWidthPx = initialPlacement
    ? initialPlacement.width / pointsPerPixel
    : displayed.width * DEFAULT_WIDTH_RATIO;
  const initialHeightPx = initialPlacement
    ? initialPlacement.height / pointsPerPixel
    : initialWidthPx / imageAspectRatio;
  const initialLeftPx = initialPlacement
    ? initialPlacement.x / pointsPerPixel
    : (displayed.width - initialWidthPx) / 2;
  const initialTopPx = initialPlacement
    ? displayed.height -
      (initialPlacement.y + initialPlacement.height) / pointsPerPixel
    : (displayed.height - initialHeightPx) / 2;

  // Signature box - position/size in unscaled page-content pixels. These
  // stay valid regardless of the page's own pan/zoom below, since that's
  // just a viewport transform on the layer this box lives inside.
  const boxX = useSharedValue(initialLeftPx);
  const boxY = useSharedValue(initialTopPx);
  const boxWidth = useSharedValue(initialWidthPx);
  const boxHeight = useSharedValue(initialHeightPx);
  const baseBoxWidth = useSharedValue(initialWidthPx);
  const boxCenterX = useSharedValue(initialLeftPx + initialWidthPx / 2);
  const boxCenterY = useSharedValue(initialTopPx + initialHeightPx / 2);
  // Snapshot of the box at the start of a corner-handle drag, so each handle
  // can resize from its own corner while keeping the opposite one anchored.
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragStartWidth = useSharedValue(0);
  const dragStartHeight = useSharedValue(0);

  // Page viewport pan/zoom - purely a display convenience for precise
  // placement; doesn't affect the box's own page-content coordinates above.
  const pageScale = useSharedValue(1);
  const pageTranslateX = useSharedValue(0);
  const pageTranslateY = useSharedValue(0);
  const basePageScale = useSharedValue(1);

  const signaturePan = Gesture.Pan().onChange((event) => {
    boxX.value = clamp(
      boxX.value + event.changeX,
      0,
      displayed.width - boxWidth.value
    );
    boxY.value = clamp(
      boxY.value + event.changeY,
      0,
      displayed.height - boxHeight.value
    );
  });

  const signaturePinch = Gesture.Pinch()
    .onStart(() => {
      baseBoxWidth.value = boxWidth.value;
      boxCenterX.value = boxX.value + boxWidth.value / 2;
      boxCenterY.value = boxY.value + boxHeight.value / 2;
    })
    .onChange((event) => {
      const maxWidth = Math.min(
        displayed.width,
        displayed.height * imageAspectRatio
      );
      const newWidth = clamp(
        baseBoxWidth.value * event.scale,
        MIN_BOX_WIDTH_PX,
        maxWidth
      );
      const newHeight = newWidth / imageAspectRatio;
      boxWidth.value = newWidth;
      boxHeight.value = newHeight;
      boxX.value = clamp(
        boxCenterX.value - newWidth / 2,
        0,
        displayed.width - newWidth
      );
      boxY.value = clamp(
        boxCenterY.value - newHeight / 2,
        0,
        displayed.height - newHeight
      );
    });

  const signatureGesture = Gesture.Simultaneous(signaturePan, signaturePinch);

  /**
   * Builds a drag gesture for one corner handle: resizes from that corner
   * while keeping the opposite corner anchored in place, preserving the
   * signature's own aspect ratio (matching the pinch behavior above).
   */
  function makeCornerHandle(corner: 'tl' | 'tr' | 'bl' | 'br') {
    const growsLeft = corner === 'tl' || corner === 'bl';
    const growsUp = corner === 'tl' || corner === 'tr';

    return Gesture.Pan()
      .hitSlop(10)
      .onStart(() => {
        dragStartX.value = boxX.value;
        dragStartY.value = boxY.value;
        dragStartWidth.value = boxWidth.value;
        dragStartHeight.value = boxHeight.value;
      })
      .onChange((event) => {
        const maxWidth = Math.min(
          displayed.width,
          displayed.height * imageAspectRatio
        );
        const widthDelta = growsLeft ? -event.translationX : event.translationX;
        const newWidth = clamp(
          dragStartWidth.value + widthDelta,
          MIN_BOX_WIDTH_PX,
          maxWidth
        );
        const newHeight = newWidth / imageAspectRatio;

        boxWidth.value = newWidth;
        boxHeight.value = newHeight;
        boxX.value = growsLeft
          ? dragStartX.value + dragStartWidth.value - newWidth
          : dragStartX.value;
        boxY.value = growsUp
          ? dragStartY.value + dragStartHeight.value - newHeight
          : dragStartY.value;
      });
  }

  const cornerHandleTL = makeCornerHandle('tl');
  const cornerHandleTR = makeCornerHandle('tr');
  const cornerHandleBL = makeCornerHandle('bl');
  const cornerHandleBR = makeCornerHandle('br');

  const pagePan = Gesture.Pan().onChange((event) => {
    const maxTranslateX = (displayed.width * (pageScale.value - 1)) / 2;
    const maxTranslateY = (displayed.height * (pageScale.value - 1)) / 2;
    pageTranslateX.value = clamp(
      pageTranslateX.value + event.changeX,
      -maxTranslateX,
      maxTranslateX
    );
    pageTranslateY.value = clamp(
      pageTranslateY.value + event.changeY,
      -maxTranslateY,
      maxTranslateY
    );
  });

  const pagePinch = Gesture.Pinch()
    .onStart(() => {
      basePageScale.value = pageScale.value;
    })
    .onChange((event) => {
      const nextScale = clamp(
        basePageScale.value * event.scale,
        MIN_PAGE_SCALE,
        MAX_PAGE_SCALE
      );
      pageScale.value = nextScale;
      const maxTranslateX = (displayed.width * (nextScale - 1)) / 2;
      const maxTranslateY = (displayed.height * (nextScale - 1)) / 2;
      pageTranslateX.value = clamp(
        pageTranslateX.value,
        -maxTranslateX,
        maxTranslateX
      );
      pageTranslateY.value = clamp(
        pageTranslateY.value,
        -maxTranslateY,
        maxTranslateY
      );
    });

  const pageGesture = Gesture.Simultaneous(pagePan, pagePinch);

  const pageContentStyle = useAnimatedStyle(() => ({
    width: displayed.width,
    height: displayed.height,
    transform: [
      { translateX: pageTranslateX.value },
      { translateY: pageTranslateY.value },
      { scale: pageScale.value },
    ],
  }));

  const boxStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: boxX.value,
    top: boxY.value,
    width: boxWidth.value,
    height: boxHeight.value,
  }));

  const handleConfirm = () => {
    const x = boxX.value * pointsPerPixel;
    const width = boxWidth.value * pointsPerPixel;
    const height = boxHeight.value * pointsPerPixel;
    const y = pageHeightPt - (boxY.value + boxHeight.value) * pointsPerPixel;
    onConfirm({ x, y, width, height });
  };

  return (
    <View className="gap-3">
      <View
        className="overflow-hidden rounded-lg border border-border bg-white"
        style={displayed}
      >
        <GestureDetector gesture={pageGesture}>
          <Animated.View style={pageContentStyle}>
            <Image
              source={{ uri: pagePreviewUri }}
              className="flex-1"
              resizeMode="contain"
            />
            <Animated.View style={boxStyle}>
              <GestureDetector gesture={signatureGesture}>
                <View className="flex-1 rounded-sm border border-accent bg-white/70">
                  <Image
                    source={source}
                    className="flex-1"
                    resizeMode="contain"
                  />
                </View>
              </GestureDetector>

              <GestureDetector gesture={cornerHandleTL}>
                <View className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border border-accent bg-white" />
              </GestureDetector>
              <GestureDetector gesture={cornerHandleTR}>
                <View className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-accent bg-white" />
              </GestureDetector>
              <GestureDetector gesture={cornerHandleBL}>
                <View className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border border-accent bg-white" />
              </GestureDetector>
              <GestureDetector gesture={cornerHandleBR}>
                <View className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border border-accent bg-white" />
              </GestureDetector>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View className="flex-row gap-2">
        <Button className="flex-1" variant="outline" onPress={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onPress={handleConfirm}>
          Confirm
        </Button>
      </View>
    </View>
  );
}
