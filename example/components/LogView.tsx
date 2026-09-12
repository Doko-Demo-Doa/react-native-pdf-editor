import { Typography } from 'heroui-native';
import { Platform, ScrollView, StyleSheet } from 'react-native';

export function LogView({ lines }: { lines: string[] }) {
  return (
    <ScrollView style={styles.log} nestedScrollEnabled>
      {lines.map((line, i) => (
        <Typography
          key={i}
          type="body-xs"
          className="mb-1"
          style={{
            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
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
