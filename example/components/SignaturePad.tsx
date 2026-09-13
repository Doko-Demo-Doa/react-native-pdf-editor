import { Button, Typography } from 'heroui-native';
import { useRef, useState } from 'react';
import { Modal, View, useWindowDimensions } from 'react-native';
import {
  SignatureInk,
  type SignatureInkHandle,
} from 'react-native-signature-ink';
import { useResolveClassNames } from 'uniwind';

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
  // SignatureInk (a native canvas view) only takes a `style` prop, so its
  // Tailwind class needs resolving to a style object rather than `className`.
  const signatureStyle = useResolveClassNames('flex-1');

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
      <View
        className="flex-1 justify-center bg-black/50"
        style={{ padding: CANVAS_PADDING }}
      >
        <View className="gap-3 rounded-2xl bg-white p-4">
          <Typography type="h6">Draw your signature</Typography>
          <Typography type="body-sm" color="muted">
            Sign with your finger or a stylus. This becomes the visible
            signature image embedded in the PDF.
          </Typography>

          <View
            className="overflow-hidden rounded-lg border border-border bg-white"
            style={{ width: canvasWidth, height: CANVAS_HEIGHT }}
          >
            <SignatureInk
              ref={signatureRef}
              style={signatureStyle}
              backgroundColor="#ffffff"
              penColor="#000000"
              onChange={(e) => setIsEmpty(e.isEmpty)}
            />
          </View>

          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onPress={handleCancel}
              isDisabled={isCapturing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onPress={handleClear}
              isDisabled={isCapturing || isEmpty}
            >
              Clear
            </Button>
            <Button
              className="flex-1"
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
