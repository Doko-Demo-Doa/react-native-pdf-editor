import { Ionicons } from '@expo/vector-icons';
import { Button, Description, Menu, Typography } from 'heroui-native';
import { Image, View } from 'react-native';

import { formatter } from '@/utils/formatter';

export type SignatureStyle = 'invisible' | 'text' | 'drawn' | 'photo';

export interface SignatureImageState {
  name: string;
  /** Set when the image came from the photo library (a stripped file path). */
  path?: string;
  /** Set when the image came from the drawing pad (no data URL prefix). */
  base64?: string;
}

const OPTIONS: Array<{
  value: SignatureStyle;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'invisible', label: 'Invisible', icon: 'eye-off-outline' },
  { value: 'text', label: 'Text', icon: 'text-outline' },
  { value: 'drawn', label: 'Drawn', icon: 'create-outline' },
  { value: 'photo', label: 'Photo', icon: 'image-outline' },
];

export function SignatureStyleMenu({
  value,
  onChange,
  image,
  onPickPhoto,
  onDrawSignature,
  onClearImage,
}: {
  value: SignatureStyle;
  onChange: (style: SignatureStyle) => void;
  image: SignatureImageState | null;
  onPickPhoto: () => void;
  onDrawSignature: () => void;
  onClearImage: () => void;
}) {
  const selected = OPTIONS.find((option) => option.value === value)!;

  return (
    <View>
      <View className="gap-2 flex-row justify-between items-center">
        <Description>Sign. type:</Description>
        <Menu className="gap-1 grow">
          <Menu.Trigger asChild>
            <Button variant="outline">
              <Ionicons name={selected.icon} size={16} />
              <Button.Label>{selected.label}</Button.Label>
              <Ionicons name="chevron-down" size={14} />
            </Button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Overlay />
            <Menu.Content presentation="popover" width={240}>
              <Menu.Label>Signature</Menu.Label>
              <Menu.Group
                selectionMode="single"
                selectedKeys={new Set([value])}
                onSelectionChange={(keys) => {
                  const [next] = Array.from(keys);
                  if (next) onChange(next as SignatureStyle);
                }}
              >
                {OPTIONS.map((option) => (
                  <Menu.Item key={option.value} id={option.value}>
                    <Ionicons name={option.icon} size={18} />
                    <Menu.ItemTitle>{option.label}</Menu.ItemTitle>
                    <Menu.ItemIndicator />
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Content>
          </Menu.Portal>
        </Menu>

        {value === 'drawn' && (
          <Button variant="danger-soft" onPress={onDrawSignature}>
            {image ? 'Redraw' : 'Draw!'}
          </Button>
        )}

        {value === 'photo' && (
          <Button variant="danger-soft" onPress={onPickPhoto}>
            {image ? 'Change...' : 'Choose...'}
          </Button>
        )}
      </View>

      {image && (value === 'drawn' || value === 'photo') && (
        <View className="flex-row items-center gap-3">
          <Image
            source={{
              uri: image.base64
                ? `data:image/png;base64,${image.base64}`
                : `file://${image.path}`,
            }}
            className="h-16 w-16 rounded-lg border border-border"
            resizeMode="contain"
          />
          <Typography type="body-sm" color="muted" className="flex-1">
            {formatter.trimString(image.name)}
          </Typography>
          <Button variant="ghost" onPress={onClearImage}>
            Clear
          </Button>
        </View>
      )}
    </View>
  );
}
