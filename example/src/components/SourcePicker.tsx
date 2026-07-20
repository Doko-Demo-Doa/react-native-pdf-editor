import { Button, StyleSheet, Text, View } from 'react-native';

export function SourcePicker({
  onUseSample,
  onPickFile,
}: {
  onUseSample: () => void;
  onPickFile: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Start from a generated sample or pick a real PDF.
      </Text>
      <Button title="Generate sample document" onPress={onUseSample} />
      <Button title="Pick a PDF file" onPress={onPickFile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
});
