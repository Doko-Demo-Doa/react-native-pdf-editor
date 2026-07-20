import { Platform, ScrollView, StyleSheet } from 'react-native';
import { Typography } from './ui';

export function LogView({ lines }: { lines: string[] }) {
  return (
    <ScrollView style={styles.log}>
      {lines.map((line, i) => (
        <Typography
          key={i}
          type="body-xs"
          style={{
            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
            marginBottom: 4,
          }}
        >
          {line}
        </Typography>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  log: {
    maxHeight: 144,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#eef2f7',
  },
});
