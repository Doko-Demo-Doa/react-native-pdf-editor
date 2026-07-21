import { Link } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from '../src/components/ui';
import { layoutStyles } from '../src/styles';

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
    href: '/verify-signature',
    title: 'Verify signature',
    description: 'Inspect signed fields and verify signed byte ranges',
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
  {
    href: '/metadata',
    title: 'Metadata',
    description: 'Pick a PDF and inspect its file and document metadata',
  },
] as const;

export default function Home() {
  return (
    <ScrollView contentContainerStyle={layoutStyles.scrollContent}>
      {EXAMPLES.map((example) => (
        <Link key={example.href} href={example.href} asChild>
          <Pressable>
            <Card variant="secondary">
              <CardBody className="gap-1">
                <CardTitle>{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardBody>
            </Card>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
