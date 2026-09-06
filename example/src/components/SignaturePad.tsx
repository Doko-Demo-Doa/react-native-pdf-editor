import { useRef, useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import {
  Stage,
  BrushLayer,
  BRUSH_PATHS,
  type BrushStrokeEvent,
} from 'react-native-canvas-kit';
import { Button, CardTitle, Typography } from './ui';

type Stroke = { id: string; points: number[] };

const CANVAS_HEIGHT = 220;
const CANVAS_PADDING = 32;
const SHEET_PADDING = 16;

export interface SignaturePadProps {
  visible: boolean;
  onCancel: () => void;
  /** Base64 PNG (no data URL prefix), leaf-first ink over a white background. */
  onDone: (base64Png: string) => void;
}

export function SignaturePad({ visible, onCancel, onDone }: SignaturePadProps) {
  const { width: windowWidth } = useWindowDimensions();
  const canvasWidth = windowWidth - (CANVAS_PADDING + SHEET_PADDING) * 2;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const nextId = useRef(0);
  const captureRef_ = useRef<View>(null);

  const handleStrokeEnd = ({ points }: BrushStrokeEvent) => {
    setStrokes((prev) => [...prev, { id: `s${nextId.current++}`, points }]);
  };

  const handleClear = () => setStrokes([]);

  const handleCancel = () => {
    setStrokes([]);
    onCancel();
  };

  const handleDone = async () => {
    if (strokes.length === 0 || !captureRef_.current) return;
    setIsCapturing(true);
    try {
      const base64 = await captureRef(captureRef_, {
        format: 'png',
        result: 'base64',
      });
      setStrokes([]);
      onDone(base64);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <GestureHandlerRootView style={styles.backdrop}>
        <View style={styles.sheet}>
          <CardTitle>Draw your signature</CardTitle>
          <Typography type="body-sm" color="muted">
            Sign with your finger or a stylus. This becomes the visible
            signature image embedded in the PDF.
          </Typography>

          <View
            ref={captureRef_}
            collapsable={false}
            style={[
              styles.canvasWrap,
              { width: canvasWidth, height: CANVAS_HEIGHT },
            ]}
          >
            <Stage width={canvasWidth} height={CANVAS_HEIGHT}>
              <BrushLayer tool="pen" onStrokeEnd={handleStrokeEnd}>
                {strokes.map((s) => {
                  const Brush = BRUSH_PATHS.pen;
                  return <Brush key={s.id} points={s.points} />;
                })}
              </BrushLayer>
            </Stage>
          </View>

          <View style={styles.actions}>
            <Button
              style={styles.flex1}
              variant="outline"
              onPress={handleCancel}
              isDisabled={isCapturing}
            >
              Cancel
            </Button>
            <Button
              style={styles.flex1}
              variant="outline"
              onPress={handleClear}
              isDisabled={isCapturing || strokes.length === 0}
            >
              Clear
            </Button>
            <Button
              style={styles.flex1}
              onPress={handleDone}
              isDisabled={isCapturing || strokes.length === 0}
            >
              {isCapturing ? 'Saving...' : 'Done'}
            </Button>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: CANVAS_PADDING,
  },
  sheet: {
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SHEET_PADDING,
  },
  canvasWrap: {
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8ced8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
});
