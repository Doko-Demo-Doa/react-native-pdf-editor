import { Button, Typography } from './ui';
import { View } from 'react-native';
import { layoutStyles } from '../styles';

export function SourcePicker({
  onUseSample,
  onPickFile,
}: {
  onUseSample: () => void;
  onPickFile: () => void;
}) {
  return (
    <View style={layoutStyles.stack}>
      <Typography type="body-sm" color="muted">
        Start from a generated sample or pick a real PDF.
      </Typography>
      <Button variant="secondary" onPress={onUseSample}>
        Generate sample document
      </Button>
      <Button variant="outline" onPress={onPickFile}>
        Pick a PDF file
      </Button>
    </View>
  );
}
