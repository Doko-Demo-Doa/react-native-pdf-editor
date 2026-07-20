import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const EXAMPLES = [
  {
    href: '/add-page',
    title: 'Add page',
    description: 'Append pages to a document',
  },
  {
    href: '/add-text',
    title: 'Add text',
    description: 'Draw text onto a page with a painter',
  },
  {
    href: '/rotate',
    title: 'Rotate',
    description: 'Rotate a page 90° at a time',
  },
  {
    href: '/sign',
    title: 'Sign',
    description:
      'PAdES signing with a self-created key or a biometric-gated one',
  },
  {
    href: '/diagnostics',
    title: 'Diagnostics',
    description: 'Rendering, custom fonts, text extraction smoke test',
  },
] as const;

export default function Home() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {EXAMPLES.map((example) => (
        <Link key={example.href} href={example.href} asChild>
          <Pressable style={styles.row}>
            <Text style={styles.title}>{example.title}</Text>
            <Text style={styles.description}>{example.description}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
});
