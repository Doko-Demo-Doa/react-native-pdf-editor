import { Button, Input, TextField } from 'heroui-native';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { View } from 'react-native';
import { copyForExport } from '../lib/pdf';

/**
 * Lets the user save the current working file under a name of their choice,
 * via the native share sheet - "Save to Files" on iOS, "Save to..."/Drive/a
 * file manager on Android. Copies to a dedicated exports directory first
 * (see `copyForExport`) so the share sheet never touches the file this
 * screen is still writing to on the next tap.
 */
export function SaveAsButton({
  sourcePath,
  suggestedName,
}: {
  sourcePath: string;
  suggestedName: string;
}) {
  const [filename, setFilename] = useState(suggestedName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const uri = await copyForExport(sourcePath, filename);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3">
      <TextField>
        <Input
          value={filename}
          onChangeText={setFilename}
          placeholder="File name"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </TextField>
      <Button variant="outline" onPress={save} isDisabled={saving}>
        {saving ? 'Saving...' : 'Save a copy as...'}
      </Button>
    </View>
  );
}
