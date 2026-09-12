import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { Button, Card, Spinner, Typography, useToast } from 'heroui-native';
import { useSourceDocument } from '@/utils/useSourceDocument';
import { MasterLayout } from '@/components/MasterLayout';
import { FadeIn } from 'react-native-reanimated';

function createSample() {
  const doc = PdfDocument.create();
  doc.createPage(612, 792);
  return doc;
}

type Example = {
  href: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeClassName: string;
  iconColor: string;
};

const EXAMPLES: Example[] = [
  {
    href: '/add-page',
    title: 'Add page',
    icon: 'document-attach-outline',
    badgeClassName: 'bg-blue-500/15',
    iconColor: '#3b82f6',
  },
  {
    href: '/add-text',
    title: 'Add text',
    icon: 'text-outline',
    badgeClassName: 'bg-violet-500/15',
    iconColor: '#8b5cf6',
  },
  {
    href: '/rotate',
    title: 'Rotate',
    icon: 'refresh-outline',
    badgeClassName: 'bg-amber-500/15',
    iconColor: '#f59e0b',
  },
  {
    href: '/sign',
    title: 'Sign',
    icon: 'create-outline',
    badgeClassName: 'bg-emerald-500/15',
    iconColor: '#10b981',
  },
  {
    href: '/sign-yubikey',
    title: 'Sign with YubiKey',
    icon: 'key-outline',
    badgeClassName: 'bg-teal-500/15',
    iconColor: '#14b8a6',
  },
  {
    href: '/verify-signature',
    title: 'Verify signature',
    icon: 'shield-checkmark-outline',
    badgeClassName: 'bg-cyan-500/15',
    iconColor: '#06b6d4',
  },
  {
    href: '/password',
    title: 'Password',
    icon: 'lock-closed-outline',
    badgeClassName: 'bg-rose-500/15',
    iconColor: '#f43f5e',
  },
  {
    href: '/diagnostics',
    title: 'Diagnostics',
    icon: 'pulse-outline',
    badgeClassName: 'bg-fuchsia-500/15',
    iconColor: '#d946ef',
  },
  {
    href: '/render-page',
    title: 'Render page',
    icon: 'image-outline',
    badgeClassName: 'bg-orange-500/15',
    iconColor: '#f97316',
  },
  {
    href: '/metadata',
    title: 'Metadata',
    icon: 'information-circle-outline',
    badgeClassName: 'bg-indigo-500/15',
    iconColor: '#6366f1',
  },
];

export default function Home() {
  const {
    doc,
    sourceLabel,
    useSample: generateSample,
    pickFile,
    loading,
  } = useSourceDocument(createSample);
  const { toast } = useToast();

  const handleGenerate = () => {
    generateSample();
    toast.show({ variant: 'success', label: 'Sample PDF generated' });
  };

  const handlePick = async () => {
    const label = await pickFile();
    if (label) {
      toast.show({
        variant: 'success',
        label: 'PDF loaded',
        description: label,
      });
    }
  };

  return (
    <MasterLayout>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-6">
        <Typography.Heading className="text-center pt-6">
          PDF Editor
        </Typography.Heading>

        <Typography.Paragraph>
          You can generate a sample PDF or pick one from your device.
        </Typography.Paragraph>

        <Button variant="outline" onPress={handleGenerate}>
          Generate PDF
        </Button>

        <Button onPress={handlePick}>
          {loading ? (
            <Spinner entering={FadeIn.delay(50)} color="white" />
          ) : (
            'Pick PDF'
          )}
        </Button>

        {doc && (
          <Typography.Paragraph color="muted">
            Source: {sourceLabel}
          </Typography.Paragraph>
        )}

        {doc && (
          <>
            <View className="flex-row flex-wrap gap-3">
              {EXAMPLES.map((example) => (
                <Link
                  key={example.href}
                  href={example.href}
                  asChild
                  className="w-[47%]"
                >
                  <Pressable className="active:opacity-70">
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
                      <Card.Body className="mt-3">
                        <Card.Description>{example.title}</Card.Description>
                      </Card.Body>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </MasterLayout>
  );
}
