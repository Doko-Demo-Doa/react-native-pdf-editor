import { PdfView } from '@kishannareshpal/expo-pdf';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { createSigner, signPdf } from 'react-native-pdf-editor/signing';
import { LogView } from '../src/components/LogView';
import { SourcePicker } from '../src/components/SourcePicker';
import {
  generateDemoKeyAndCert,
  signWithDemoKey,
  type DemoKeyAndCert,
} from '../src/lib/demoKey';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';

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
          log(
            'Generating RSA-2048 keypair in pure JS - can take up to a minute on some devices...'
          );
          // Yield to the event loop so the log line above actually paints
          // before this synchronous, CPU-heavy call blocks the JS thread.
          await new Promise((resolve) => setTimeout(resolve, 0));
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
      });
      log(`Signed (${mode}), PAdES B-B -> ${signedPath}`);
      setReloadKey((k) => k + 1);
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setSigning(false);
    }
  }, [doc, mode, log]);

  return (
    <View style={styles.container}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Text style={styles.description}>
            Source: {sourceLabel}. Signs with a `Signer` backed by an RSA
            keypair generated on this device - no real chain of trust, for
            demonstration only.
          </Text>
          <View style={styles.modeRow}>
            <Button
              title="Self-created key"
              onPress={() => setMode('software')}
              color={mode === 'software' ? undefined : '#9CA3AF'}
            />
            <Button
              title="Biometric"
              onPress={() => setMode('biometric')}
              color={mode === 'biometric' ? undefined : '#9CA3AF'}
            />
          </View>
          <Button
            title={signing ? 'Signing...' : 'Sign'}
            onPress={sign}
            disabled={signing}
          />
        </>
      )}
      <LogView lines={lines} />
      {reloadKey > 0 && (
        <PdfView key={reloadKey} style={styles.preview} uri={signedUri} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  preview: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
