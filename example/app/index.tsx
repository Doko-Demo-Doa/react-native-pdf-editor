import { Link } from 'expo-router';
import { Card } from 'heroui-native';
import { Pressable, ScrollView } from 'react-native';

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
    href: '/password',
    title: 'Password',
    description: 'Encrypt with a user/owner password and permissions',
  },
  {
    href: '/diagnostics',
    title: 'Diagnostics',
    description: 'Rendering, custom fonts, text extraction smoke test',
  },
  {
    href: '/render-page',
    title: 'Render page',
    description: 'Render a selected PDF page and share it as a PNG',
  },
] as const;

export default function Home() {
  return (
    <ScrollView contentContainerClassName="gap-2.5 p-4">
      {EXAMPLES.map((example) => (
        <Link key={example.href} href={example.href} asChild>
          <Pressable>
            <Card variant="secondary">
              <Card.Body className="gap-1">
                <Card.Title>{example.title}</Card.Title>
                <Card.Description>{example.description}</Card.Description>
              </Card.Body>
            </Card>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
