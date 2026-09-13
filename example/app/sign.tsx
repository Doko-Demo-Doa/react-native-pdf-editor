import { PdfView } from '@kishannareshpal/expo-pdf';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Button, Typography } from 'heroui-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { createSigner, signPdf } from 'react-native-pdf-editor/signing';
import { useResolveClassNames } from 'uniwind';

import { SaveAsButton } from '@/components/SaveAsButton';
import {
  SignatureAssemblerModal,
  type SignaturePlacement,
} from '@/components/sign/SignatureAssemblerModal';
import {
  SignatureStyleMenu,
  type SignatureImageState,
  type SignatureStyle,
} from '@/components/sign/SignatureStyleMenu';
import {
  SigningKeyMenu,
  type SigningKeyMode,
} from '@/components/sign/SigningKeyMenu';
import {
  SigningScopeField,
  type SigningScope,
} from '@/components/sign/SigningScopeField';
import { SignaturePad } from '@/components/SignaturePad';
import { SourcePicker } from '@/components/SourcePicker';
import {
  generateDemoKeyAndCert,
  signWithDemoKey,
  type DemoKeyAndCert,
} from '@/utils/demoKey';
import { demoPdfPath } from '@/utils/pdf';
import { useLog } from '@/utils/useLog';
import { useSourceDocument } from '@/utils/useSourceDocument';

const { path: unsignedPath } = demoPdfPath('sign-unsigned');
const { path: signedPath, uri: signedUri } = demoPdfPath('sign-signed');

// Used for a single-page image/text signature when no placement has been
// confirmed in the assembler yet (e.g. signing immediately after picking a
// style that doesn't need one, like invisible/text).
const DEFAULT_RECT = { x: 360, y: 36, width: 210, height: 72 };

// SecureStore keys for the biometric-gated demo key. The private key is
// stored with `requireAuthentication: true` so *reading* it back genuinely
// requires Face ID/Touch ID/BiometricPrompt, not just a UI-level prompt
// beforehand. The certificate isn't sensitive, so it's stored without a gate.
const BIOMETRIC_PRIVATE_KEY_STORE_KEY = 'demo-signing-private-key-pem';
const BIOMETRIC_CERT_STORE_KEY = 'demo-signing-cert-chain-json';

interface SignFormValues {
  mode: SigningKeyMode;
  scope: SigningScope;
  signatureStyle: SignatureStyle;
  signatureImage: SignatureImageState | null;
  signaturePlacement: SignaturePlacement | null;
}

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
  const { log } = useLog();
  const [reloadKey, setReloadKey] = useState(0);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [isAssemblerOpen, setIsAssemblerOpen] = useState(false);
  // Whether confirming the assembler should immediately sign (opened via the
  // "Sign" button) or just save the placement (opened via "Reposition").
  const [signOnConfirm, setSignOnConfirm] = useState(false);
  const [signing, setSigning] = useState(false);
  const { doc, sourceLabel, generateSample, pickFile } = useSourceDocument();
  const softwareKeyRef = useRef<DemoKeyAndCert | null>(null);
  // PdfView (a native Expo host view, not a plain RN View) only takes a
  // `style` prop, so its Tailwind classes need resolving to a style object
  // rather than passed as `className` directly.
  const pdfViewStyle = useResolveClassNames(
    'flex-1 overflow-hidden rounded-2xl'
  );

  const { control, watch, setValue } = useForm<SignFormValues>({
    defaultValues: {
      mode: 'software',
      scope: { mode: 'single', pageIndex: 0 },
      signatureStyle: 'invisible',
      signatureImage: null,
      signaturePlacement: null,
    },
  });

  const mode = watch('mode');
  const scope = watch('scope');
  const signatureStyle = watch('signatureStyle');
  const signatureImage = watch('signatureImage');
  const signaturePlacement = watch('signaturePlacement');

  useEffect(() => {
    if (doc) {
      setValue('scope', { mode: 'single', pageIndex: doc.pageCount - 1 });
      setValue('signaturePlacement', null);
    }
  }, [doc, setValue]);

  const performSign = useCallback(
    async (placementOverride?: SignaturePlacement) => {
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

        const hasImage =
          (signatureStyle === 'drawn' || signatureStyle === 'photo') &&
          signatureImage;

        const pages =
          scope.mode === 'single' ? [scope.pageIndex] : scope.pageIndices;
        const rect =
          scope.mode === 'single'
            ? (placementOverride ?? signaturePlacement ?? DEFAULT_RECT)
            : scope.rect;

        let currentInput = unsignedPath;
        for (let i = 0; i < pages.length; i++) {
          const pageIndex = pages[i]!;
          const isLast = i === pages.length - 1;
          const outputPath = isLast
            ? signedPath
            : demoPdfPath(`sign-multi-${i}`).path;

          await signPdf(signer, {
            inputPath: currentInput,
            outputPath,
            conformanceLevel: 'B-B',
            visibleTextSignature:
              signatureStyle === 'text'
                ? {
                    pageIndex,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    text: `Digitally signed (${mode})`,
                    fontName: 'Times-Roman',
                    signerName: 'react-native-pdf-editor demo',
                    reason: 'Visible signature demo',
                    location: 'Example app',
                    contactInfo: 'demo@example.invalid',
                  }
                : undefined,
            visibleImageSignature: hasImage
              ? {
                  pageIndex,
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  image: signatureImage.base64
                    ? { base64: signatureImage.base64, fit: 'contain' }
                    : { path: signatureImage.path!, fit: 'contain' },
                  signerName: 'react-native-pdf-editor demo',
                  reason: 'Visible signature image demo',
                  location: 'Example app',
                  contactInfo: 'demo@example.invalid',
                }
              : undefined,
          });
          currentInput = outputPath;
        }

        log(
          `Signed ${pages.length} page${pages.length === 1 ? '' : 's'} (${mode}, ${signatureStyle}) -> ${signedPath}`
        );
        setReloadKey((k) => k + 1);
      } catch (error) {
        log(`Error: ${String(error)}`);
      } finally {
        setSigning(false);
      }
    },
    [doc, mode, scope, signatureImage, signatureStyle, signaturePlacement, log]
  );

  const openAssembler = useCallback((thenSign: boolean) => {
    setSignOnConfirm(thenSign);
    setIsAssemblerOpen(true);
  }, []);

  const handleSignPress = useCallback(() => {
    const needsAssembler =
      scope.mode === 'single' &&
      (signatureStyle === 'drawn' || signatureStyle === 'photo') &&
      signatureImage;
    if (needsAssembler) {
      openAssembler(true);
      return;
    }
    performSign();
  }, [scope, signatureStyle, signatureImage, openAssembler, performSign]);

  // A 'drawn'/'photo' style with no image acquired yet would otherwise sign
  // silently without any visible signature, contrary to what was selected.
  const needsImage = signatureStyle === 'drawn' || signatureStyle === 'photo';
  const canSign = !signing && (!needsImage || signatureImage !== null);

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
    setValue('signatureImage', {
      path: asset.uri.replace(/^file:\/\//, ''),
      name: asset.fileName ?? 'Photo library image',
    });
  }, [log, setValue]);

  return (
    <View className="flex-1 gap-3 bg-background p-4">
      {!doc ? (
        <SourcePicker
          onUseSample={() => generateSample(createSample)}
          onPickFile={pickFile}
        />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}
          </Typography>

          <Controller
            control={control}
            name="mode"
            render={({ field: { value, onChange } }) => (
              <SigningKeyMenu value={value} onChange={onChange} />
            )}
          />

          <Controller
            control={control}
            name="scope"
            render={({ field: { value, onChange } }) => (
              <SigningScopeField
                key={doc.pageCount}
                pageCount={doc.pageCount}
                value={value}
                onChange={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="signatureStyle"
            render={({ field: { value, onChange } }) => (
              <SignatureStyleMenu
                value={value}
                onChange={onChange}
                image={signatureImage}
                onPickPhoto={pickSignatureImage}
                onDrawSignature={() => setIsSignaturePadOpen(true)}
                onClearImage={() => setValue('signatureImage', null)}
                onReposition={() => openAssembler(false)}
              />
            )}
          />

          <Button onPress={handleSignPress} isDisabled={!canSign}>
            {signing ? 'Signing...' : 'Sign'}
          </Button>
        </>
      )}

      {reloadKey > 0 && (
        <>
          <SaveAsButton sourcePath={signedPath} suggestedName="signed" />
          <PdfView key={reloadKey} style={pdfViewStyle} uri={signedUri} />
        </>
      )}

      <SignaturePad
        visible={isSignaturePadOpen}
        onCancel={() => setIsSignaturePadOpen(false)}
        onDone={(base64) => {
          setValue('signatureImage', { base64, name: 'Drawn signature' });
          setIsSignaturePadOpen(false);
        }}
      />

      {doc && signatureImage && scope.mode === 'single' && (
        <SignatureAssemblerModal
          visible={isAssemblerOpen}
          doc={doc}
          pageIndex={scope.pageIndex}
          signatureImage={signatureImage}
          initialPlacement={signaturePlacement}
          onCancel={() => setIsAssemblerOpen(false)}
          onConfirm={(placement) => {
            setValue('signaturePlacement', placement);
            setIsAssemblerOpen(false);
            if (signOnConfirm) performSign(placement);
          }}
        />
      )}
    </View>
  );
}
