import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  FieldError,
  Input,
  Label,
  Menu,
  TextField,
} from 'heroui-native';
import { useState } from 'react';
import { View } from 'react-native';

export type SigningScope =
  | { mode: 'single'; pageIndex: number }
  | {
      mode: 'multiple';
      pageIndices: number[];
      rect: { width: number; height: number; x: number; y: number };
    };

type ScopeMode = SigningScope['mode'];

const MODE_ICON: Record<ScopeMode, keyof typeof Ionicons.glyphMap> = {
  single: 'document-outline',
  multiple: 'copy-outline',
};

const MODE_LABEL: Record<ScopeMode, string> = {
  single: 'Single page',
  multiple: 'Multiple pages',
};

interface MultiFieldOverrides {
  pageListText?: string;
  widthText?: string;
  heightText?: string;
  xText?: string;
  yText?: string;
}

export function SigningScopeField({
  pageCount,
  value,
  onChange,
}: {
  pageCount: number;
  value: SigningScope;
  onChange: (scope: SigningScope) => void;
}) {
  const [mode, setMode] = useState<ScopeMode>(value.mode);
  const [pageIndexText, setPageIndexText] = useState(
    value.mode === 'single' ? String(value.pageIndex) : String(pageCount - 1)
  );
  const [pageListText, setPageListText] = useState(
    value.mode === 'multiple' ? value.pageIndices.join(', ') : ''
  );
  const [widthText, setWidthText] = useState(
    value.mode === 'multiple' ? String(value.rect.width) : '210'
  );
  const [heightText, setHeightText] = useState(
    value.mode === 'multiple' ? String(value.rect.height) : '72'
  );
  const [xText, setXText] = useState(
    value.mode === 'multiple' ? String(value.rect.x) : '360'
  );
  const [yText, setYText] = useState(
    value.mode === 'multiple' ? String(value.rect.y) : '36'
  );
  const [error, setError] = useState<string | null>(null);

  const commitSingle = (text: string) => {
    setPageIndexText(text);
    const index = Number.parseInt(text, 10);
    if (!Number.isInteger(index) || index < 0 || index >= pageCount) {
      setError(`Enter a page from 0 to ${pageCount - 1}`);
      return;
    }
    setError(null);
    onChange({ mode: 'single', pageIndex: index });
  };

  const commitMultiple = (overrides: MultiFieldOverrides = {}) => {
    const listText = overrides.pageListText ?? pageListText;
    const wText = overrides.widthText ?? widthText;
    const hText = overrides.heightText ?? heightText;
    const xT = overrides.xText ?? xText;
    const yT = overrides.yText ?? yText;

    const indices = listText
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((part) => Number.parseInt(part, 10));

    if (indices.length === 0) {
      setError('Enter at least one page index');
      return;
    }
    if (
      indices.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= pageCount
      )
    ) {
      setError(`Each page must be from 0 to ${pageCount - 1}`);
      return;
    }

    const width = Number.parseFloat(wText);
    const height = Number.parseFloat(hText);
    const x = Number.parseFloat(xT);
    const y = Number.parseFloat(yT);
    if (![width, height, x, y].every((n) => Number.isFinite(n) && n >= 0)) {
      setError('Size and offset must be non-negative numbers');
      return;
    }

    setError(null);
    onChange({
      mode: 'multiple',
      pageIndices: [...new Set(indices)],
      rect: { width, height, x, y },
    });
  };

  const selectMode = (next: ScopeMode) => {
    setMode(next);
    setError(null);
    if (next === 'single') {
      commitSingle(pageIndexText);
    } else {
      commitMultiple();
    }
  };

  return (
    <View className="gap-2">
      <Menu>
        <Menu.Trigger asChild>
          <Button variant="outline">
            <Ionicons name={MODE_ICON[mode]} size={16} />
            <Button.Label>{MODE_LABEL[mode]}</Button.Label>
            <Ionicons name="chevron-down" size={14} />
          </Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Overlay />
          <Menu.Content presentation="popover" width={220}>
            <Menu.Label>Sign</Menu.Label>
            <Menu.Group
              selectionMode="single"
              selectedKeys={new Set([mode])}
              onSelectionChange={(keys) => {
                const [next] = Array.from(keys);
                if (next === 'single' || next === 'multiple') {
                  selectMode(next);
                }
              }}
            >
              <Menu.Item id="single">
                <Ionicons name={MODE_ICON.single} size={18} />
                <Menu.ItemTitle>{MODE_LABEL.single}</Menu.ItemTitle>
                <Menu.ItemIndicator />
              </Menu.Item>
              <Menu.Item id="multiple">
                <Ionicons name={MODE_ICON.multiple} size={18} />
                <Menu.ItemTitle>{MODE_LABEL.multiple}</Menu.ItemTitle>
                <Menu.ItemIndicator />
              </Menu.Item>
            </Menu.Group>
          </Menu.Content>
        </Menu.Portal>
      </Menu>

      {mode === 'single' ? (
        <TextField isInvalid={!!error}>
          <Label>Page (0-based, max {pageCount - 1})</Label>
          <Input
            value={pageIndexText}
            onChangeText={commitSingle}
            keyboardType="number-pad"
            placeholder={String(pageCount - 1)}
          />
          {error && <FieldError>{error}</FieldError>}
        </TextField>
      ) : (
        <>
          <TextField isInvalid={!!error}>
            <Label>Pages (0-based, comma-separated)</Label>
            <Input
              value={pageListText}
              onChangeText={(text) => {
                setPageListText(text);
                commitMultiple({ pageListText: text });
              }}
              placeholder={`e.g. 0, ${Math.max(pageCount - 1, 1)}`}
            />
          </TextField>
          <View className="flex-row gap-2">
            <TextField className="flex-1">
              <Label>Width</Label>
              <Input
                value={widthText}
                onChangeText={(text) => {
                  setWidthText(text);
                  commitMultiple({ widthText: text });
                }}
                keyboardType="decimal-pad"
              />
            </TextField>
            <TextField className="flex-1">
              <Label>Height</Label>
              <Input
                value={heightText}
                onChangeText={(text) => {
                  setHeightText(text);
                  commitMultiple({ heightText: text });
                }}
                keyboardType="decimal-pad"
              />
            </TextField>
          </View>
          <View className="flex-row gap-2">
            <TextField className="flex-1">
              <Label>X offset</Label>
              <Input
                value={xText}
                onChangeText={(text) => {
                  setXText(text);
                  commitMultiple({ xText: text });
                }}
                keyboardType="decimal-pad"
              />
            </TextField>
            <TextField className="flex-1">
              <Label>Y offset</Label>
              <Input
                value={yText}
                onChangeText={(text) => {
                  setYText(text);
                  commitMultiple({ yText: text });
                }}
                keyboardType="decimal-pad"
              />
            </TextField>
          </View>
          {error && <FieldError isInvalid>{error}</FieldError>}
        </>
      )}
    </View>
  );
}
