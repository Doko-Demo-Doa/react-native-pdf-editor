import { useRef, useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  SignatureInk,
  type SignatureInkHandle,
} from 'react-native-signature-ink';
import { Button, CardTitle, Typography } from './ui';

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
  const [isEmpty, setIsEmpty] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const signatureRef = useRef<SignatureInkHandle>(null);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  };

  const handleCancel = () => {
    handleClear();
    onCancel();
  };

  const handleDone = async () => {
    if (isEmpty) return;
    setIsCapturing(true);
    try {
      const base64 = await signatureRef.current?.toBase64({ format: 'png' });
      if (!base64) return;
      handleClear();
      onDone(base64);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <CardTitle>Draw your signature</CardTitle>
          <Typography type="body-sm" color="muted">
            Sign with your finger or a stylus. This becomes the visible
            signature image embedded in the PDF.
          </Typography>

          <View
            style={[
              styles.canvasWrap,
              { width: canvasWidth, height: CANVAS_HEIGHT },
            ]}
          >
            <SignatureInk
              ref={signatureRef}
              style={styles.canvas}
              backgroundColor="#ffffff"
              penColor="#000000"
              onChange={(e) => setIsEmpty(e.isEmpty)}
            />
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
              isDisabled={isCapturing || isEmpty}
            >
              Clear
            </Button>
            <Button
              style={styles.flex1}
              onPress={handleDone}
              isDisabled={isCapturing || isEmpty}
            >
              {isCapturing ? 'Saving...' : 'Done'}
            </Button>
          </View>
        </View>
      </View>
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
  canvas: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
});
