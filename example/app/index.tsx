import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { layoutStyles } from '@/styles';
import { useSourceDocument } from '@/utils/useSourceDocument';
import { Button, Card, Typography } from 'heroui-native';

function createSample() {
  const doc = PdfDocument.create();
  doc.createPage(612, 792);
  return doc;
}

type Example = {
  href: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeClassName: string;
  iconColor: string;
};

const EXAMPLES: Example[] = [
  {
    href: '/add-page',
    title: 'Add page',
    description: 'Append pages to a document',
    icon: 'document-attach-outline',
    badgeClassName: 'bg-blue-500/15',
    iconColor: '#3b82f6',
  },
  {
    href: '/add-text',
    title: 'Add text',
    description: 'Draw text onto a page with a painter',
    icon: 'text-outline',
    badgeClassName: 'bg-violet-500/15',
    iconColor: '#8b5cf6',
  },
  {
    href: '/rotate',
    title: 'Rotate',
    description: 'Rotate a page 90° at a time',
    icon: 'refresh-outline',
    badgeClassName: 'bg-amber-500/15',
    iconColor: '#f59e0b',
  },
  {
    href: '/sign',
    title: 'Sign',
    description:
      'PAdES signing with a self-created key or a biometric-gated one',
    icon: 'create-outline',
    badgeClassName: 'bg-emerald-500/15',
    iconColor: '#10b981',
  },
  {
    href: '/sign-yubikey',
    title: 'Sign with YubiKey',
    description: 'PAdES signing with a PIV key over USB or NFC',
    icon: 'key-outline',
    badgeClassName: 'bg-teal-500/15',
    iconColor: '#14b8a6',
  },
  {
    href: '/verify-signature',
    title: 'Verify signature',
    description: 'Inspect signed fields and verify signed byte ranges',
    icon: 'shield-checkmark-outline',
    badgeClassName: 'bg-cyan-500/15',
    iconColor: '#06b6d4',
  },
  {
    href: '/password',
    title: 'Password',
    description: 'Encrypt with a user/owner password and permissions',
    icon: 'lock-closed-outline',
    badgeClassName: 'bg-rose-500/15',
    iconColor: '#f43f5e',
  },
  {
    href: '/diagnostics',
    title: 'Diagnostics',
    description: 'Rendering, custom fonts, text extraction smoke test',
    icon: 'pulse-outline',
    badgeClassName: 'bg-fuchsia-500/15',
    iconColor: '#d946ef',
  },
  {
    href: '/render-page',
    title: 'Render page',
    description: 'Render a selected PDF page and share it as a PNG',
    icon: 'image-outline',
    badgeClassName: 'bg-orange-500/15',
    iconColor: '#f97316',
  },
  {
    href: '/metadata',
    title: 'Metadata',
    description: 'Pick a PDF and inspect its file and document metadata',
    icon: 'information-circle-outline',
    badgeClassName: 'bg-indigo-500/15',
    iconColor: '#6366f1',
  },
];

export default function Home() {
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);

  return (
    <ScrollView contentContainerStyle={layoutStyles.scrollContent}>
      <Typography.Heading>PDF Editor Examples</Typography.Heading>

      <Typography.Paragraph>
        First, let's generate a sample PDF or pick one from your device.
      </Typography.Paragraph>

      <Button variant="outline" onPress={useSample}>
        Generate PDF
      </Button>

      <Button onPress={pickFile}>Pick PDF</Button>

      {doc && (
        <Typography.Paragraph color="muted">
          Source: {sourceLabel}
        </Typography.Paragraph>
      )}

      {doc && (
        <>
          <Typography.Paragraph>
            Then, choose an example below to exercise a feature of the library.
          </Typography.Paragraph>

          {EXAMPLES.map((example) => (
            <Link key={example.href} href={example.href} asChild>
              <Pressable>
                <Card variant="secondary">
                  <Card.Header>
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-2xl ${example.badgeClassName}`}
                    >
                      <Ionicons
                        name={example.icon}
                        size={22}
                        color={example.iconColor}
                      />
                    </View>
                  </Card.Header>
                  <Card.Body className="mt-3 gap-1">
                    <Card.Title>{example.title}</Card.Title>
                    <Card.Description>{example.description}</Card.Description>
                  </Card.Body>
                </Card>
              </Pressable>
            </Link>
          ))}
        </>
      )}
    </ScrollView>
  );
}
