import { ScrollView } from 'react-native';
import { layoutStyles } from '@/styles';
import { Button, Typography } from 'heroui-native';

// const EXAMPLES = [
//   {
//     href: '/add-page',
//     title: 'Add page',
//     description: 'Append pages to a document',
//   },
//   {
//     href: '/add-text',
//     title: 'Add text',
//     description: 'Draw text onto a page with a painter',
//   },
//   {
//     href: '/rotate',
//     title: 'Rotate',
//     description: 'Rotate a page 90° at a time',
//   },
//   {
//     href: '/sign',
//     title: 'Sign',
//     description:
//       'PAdES signing with a self-created key or a biometric-gated one',
//   },
//   {
//     href: '/sign-yubikey',
//     title: 'Sign with YubiKey',
//     description: 'PAdES signing with a PIV key over USB or NFC',
//   },
//   {
//     href: '/verify-signature',
//     title: 'Verify signature',
//     description: 'Inspect signed fields and verify signed byte ranges',
//   },
//   {
//     href: '/password',
//     title: 'Password',
//     description: 'Encrypt with a user/owner password and permissions',
//   },
//   {
//     href: '/diagnostics',
//     title: 'Diagnostics',
//     description: 'Rendering, custom fonts, text extraction smoke test',
//   },
//   {
//     href: '/render-page',
//     title: 'Render page',
//     description: 'Render a selected PDF page and share it as a PNG',
//   },
//   {
//     href: '/metadata',
//     title: 'Metadata',
//     description: 'Pick a PDF and inspect its file and document metadata',
//   },
// ] as const;

export default function Home() {
  return (
    <ScrollView contentContainerStyle={layoutStyles.scrollContent}>
      <Typography.Heading>PDF Editor Examples</Typography.Heading>

      <Typography.Paragraph>
        First, let's generate a sample PDF or pick one from your device.
      </Typography.Paragraph>

      <Button variant="outline">Generate PDF</Button>

      <Button>Pick PDF</Button>

      <Typography.Paragraph>
        Then, choose an example below to exercise a feature of the library.
      </Typography.Paragraph>
    </ScrollView>
  );
}
