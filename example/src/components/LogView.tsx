import { ScrollView, StyleSheet, Text } from 'react-native';

export function LogView({ lines }: { lines: string[] }) {
  return (
    <ScrollView style={styles.container}>
      {lines.map((line, i) => (
        <Text key={i} style={styles.line}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 140,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
  },
  line: {
    fontSize: 12,
    fontFamily: 'Menlo',
    marginBottom: 4,
  },
});
