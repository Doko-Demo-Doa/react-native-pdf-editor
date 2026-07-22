import { PdfView } from '@kishannareshpal/expo-pdf';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Button, Typography } from '../src/components/ui';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { createSigner, signPdf } from 'react-native-pdf-editor/signing';
import { LogView } from '../src/components/LogView';
import { SaveAsButton } from '../src/components/SaveAsButton';
import { SourcePicker } from '../src/components/SourcePicker';
import {
  generateDemoKeyAndCert,
  signWithDemoKey,
  type DemoKeyAndCert,
} from '../src/lib/demoKey';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';
import { layoutStyles } from '../src/styles';

const { path: unsignedPath } = demoPdfPath('sign-unsigned');
const { path: signedPath, uri: signedUri } = demoPdfPath('sign-signed');

// SecureStore keys for the biometric-gated demo key. The private key is
// stored with `requireAuthentication: true` so *reading* it back genuinely
// requires Face ID/Touch ID/BiometricPrompt, not just a UI-level prompt
// beforehand. The certificate isn't sensitive, so it's stored without a gate.
const BIOMETRIC_PRIVATE_KEY_STORE_KEY = 'demo-signing-private-key-pem';
const BIOMETRIC_CERT_STORE_KEY = 'demo-signing-cert-chain-json';

function createSample() {
  const doc = PdfDocument.create();
  const page = doc.createPage(612, 300);
  const painter = page.createPainter();
  painter.setNonStrokingColorRGB(1, 1, 1);
  painter.drawRectangle(0, 0, 612, 300, true);
  painter.setNonStrokingColorRGB(0, 0, 0);
  const font = doc.getStandard14Font('Helvetica');
  painter.setFont(font, 20);
  painter.drawText('Document to be signed', 50, 220);
  painter.finishDrawing();
  return doc;
}

async function getOrCreateBiometricKey(
  log: (line: string) => void
): Promise<DemoKeyAndCert> {
  const storedPem = await SecureStore.getItemAsync(
    BIOMETRIC_PRIVATE_KEY_STORE_KEY,
    {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to access the signing key',
    }
  );
  const storedCertJson = await SecureStore.getItemAsync(
    BIOMETRIC_CERT_STORE_KEY
  );
  if (storedPem && storedCertJson) {
    return {
      privateKeyPem: storedPem,
      certificateChain: JSON.parse(storedCertJson),
    };
  }

  log('No stored biometric key yet, generating one now...');
  const generated = generateDemoKeyAndCert(
    'react-native-pdf-editor demo (biometric)'
  );
  await SecureStore.setItemAsync(
    BIOMETRIC_PRIVATE_KEY_STORE_KEY,
    generated.privateKeyPem,
    {
      requireAuthentication: true,
    }
  );
  await SecureStore.setItemAsync(
    BIOMETRIC_CERT_STORE_KEY,
    JSON.stringify(generated.certificateChain)
  );
  return generated;
}

export default function SignExample() {
  const { lines, log } = useLog();
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<'software' | 'biometric'>('software');
  const [signatureVisibility, setSignatureVisibility] = useState<
    'invisible' | 'visible'
  >('invisible');
  const [signatureImage, setSignatureImage] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [signing, setSigning] = useState(false);
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);
  const softwareKeyRef = useRef<DemoKeyAndCert | null>(null);

  const sign = useCallback(async () => {
    if (!doc) return;
    setSigning(true);
    try {
      await doc.save(unsignedPath);

      let keyAndCert: DemoKeyAndCert;
      if (mode === 'biometric') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          log(
            'No biometric hardware/enrollment on this device - cannot demo this path here.'
          );
          return;
        }
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to sign the PDF',
        });
        if (!auth.success) {
          log(`Authentication failed: ${auth.error ?? 'unknown reason'}`);
          return;
        }
        keyAndCert = await getOrCreateBiometricKey(log);
      } else {
        if (!softwareKeyRef.current) {
          softwareKeyRef.current = generateDemoKeyAndCert(
            'react-native-pdf-editor demo (software)'
          );
          log(
            'Generated an in-memory RSA-2048 keypair + self-signed certificate.'
          );
        }
        keyAndCert = softwareKeyRef.current;
      }

      const signer = createSigner({
        keyAlgorithm: 'RSA',
        certificateChain: keyAndCert.certificateChain,
        rawSign: (payloadBase64, algorithm) =>
          signWithDemoKey(keyAndCert.privateKeyPem, payloadBase64, algorithm),
      });

      await signPdf(signer, {
        inputPath: unsignedPath,
        outputPath: signedPath,
        conformanceLevel: 'B-B',
        visibleTextSignature:
          signatureVisibility === 'visible' && !signatureImage
            ? {
                pageIndex: 0,
                x: 360,
                y: 36,
                width: 210,
                height: 72,
                text: `Digitally signed (${mode})`,
                fontName: 'Times-Roman',
                signerName: 'react-native-pdf-editor demo',
                reason: 'Visible signature demo',
                location: 'Example app',
                contactInfo: 'demo@example.invalid',
              }
            : undefined,
        visibleImageSignature:
          signatureVisibility === 'visible' && signatureImage
            ? {
                pageIndex: 0,
                x: 360,
                y: 36,
                width: 210,
                height: 72,
                image: {
                  path: signatureImage.path,
                  fit: 'contain',
                },
                signerName: 'react-native-pdf-editor demo',
                reason: 'Visible signature image demo',
                location: 'Example app',
                contactInfo: 'demo@example.invalid',
              }
            : undefined,
      });
      log(
        `Signed (${mode}, ${signatureVisibility}), PAdES B-B -> ${signedPath}`
      );
      setReloadKey((k) => k + 1);
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setSigning(false);
    }
  }, [doc, mode, signatureImage, signatureVisibility, log]);

  const pickSignatureImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      log('Photo library permission was not granted.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled) {
      return;
    }

    const asset = result.assets[0]!;
    setSignatureImage({
      path: asset.uri.replace(/^file:\/\//, ''),
      name: asset.fileName ?? 'Photo library image',
    });
  }, [log]);

  return (
    <View style={layoutStyles.screen}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Signs with a `Signer` backed by an RSA
            keypair generated on this device - no real chain of trust, for
            demonstration only.
          </Typography>
          <View style={layoutStyles.row}>
            <Button
              style={layoutStyles.flex1}
              variant={mode === 'software' ? 'primary' : 'outline'}
              onPress={() => setMode('software')}
            >
              Self-created key
            </Button>
            <Button
              style={layoutStyles.flex1}
              variant={mode === 'biometric' ? 'primary' : 'outline'}
              onPress={() => setMode('biometric')}
            >
              Biometric
            </Button>
          </View>
          <View style={layoutStyles.row}>
            <Button
              style={layoutStyles.flex1}
              variant={
                signatureVisibility === 'invisible' ? 'primary' : 'outline'
              }
              onPress={() => setSignatureVisibility('invisible')}
            >
              Invisible
            </Button>
            <Button
              style={layoutStyles.flex1}
              variant={
                signatureVisibility === 'visible' ? 'primary' : 'outline'
              }
              onPress={() => setSignatureVisibility('visible')}
            >
              Visible
            </Button>
          </View>
          {signatureVisibility === 'visible' && (
            <>
              <View style={layoutStyles.row}>
                <Button
                  style={layoutStyles.flex1}
                  variant="outline"
                  onPress={pickSignatureImage}
                >
                  Pick signature image
                </Button>
                {signatureImage && (
                  <Button
                    style={layoutStyles.flex1}
                    variant="outline"
                    onPress={() => setSignatureImage(null)}
                  >
                    Clear image
                  </Button>
                )}
              </View>
              {signatureImage && (
                <Typography type="body-sm" color="muted">
                  Image: {signatureImage.name}
                </Typography>
              )}
            </>
          )}
          <Button onPress={sign} isDisabled={signing}>
            {signing ? 'Signing...' : 'Sign'}
          </Button>
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <>
          <SaveAsButton sourcePath={signedPath} suggestedName="signed" />
          <PdfView
            key={reloadKey}
            style={layoutStyles.pdfView}
            uri={signedUri}
          />
        </>
      )}
    </View>
  );
}
