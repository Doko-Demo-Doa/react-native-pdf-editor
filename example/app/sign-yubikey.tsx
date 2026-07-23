import { PdfView } from '@kishannareshpal/expo-pdf';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { signPdf, type DigestAlgorithm } from 'react-native-pdf-editor/signing';
import { Core, Piv } from '@doko/react-native-yubikit';
import type {
  PivKeyType,
  PivSlot,
  PivSlotMetadata,
  YubiKeyDevice,
} from '@doko/react-native-yubikit';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardTitle,
  Input,
  Label,
  TextField,
  Typography,
} from '../src/components/ui';
import { LogView } from '../src/components/LogView';
import { SaveAsButton } from '../src/components/SaveAsButton';
import { SourcePicker } from '../src/components/SourcePicker';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';
import { createYubiKeyPivSigner } from '../src/signers/yubiKeyPivSigner';
import { layoutStyles } from '../src/styles';

const PreviewPdfView = PdfView as unknown as ComponentType<{
  style: object;
  uri: string;
}>;

const { path: unsignedPath } = demoPdfPath('yubikey-sign-unsigned');
const { path: signedPath, uri: signedUri } = demoPdfPath('yubikey-sign-signed');

const PIV_SLOTS: PivSlot[] = [
  'SIGNATURE',
  'AUTHENTICATION',
  'CARD_AUTH',
  'KEY_MANAGEMENT',
];

const HASH_ALGORITHMS: DigestAlgorithm[] = ['SHA256', 'SHA384', 'SHA512'];

function createSample() {
  const doc = PdfDocument.create();
  const page = doc.createPage(612, 300);
  const painter = page.createPainter();
  painter.setNonStrokingColorRGB(1, 1, 1);
  painter.drawRectangle(0, 0, 612, 300, true);
  painter.setNonStrokingColorRGB(0, 0, 0);
  const font = doc.getStandard14Font('Helvetica');
  painter.setFont(font, 20);
  painter.drawText('Document to be signed with a YubiKey', 50, 220);
  painter.finishDrawing();
  return doc;
}

function defaultHashForKeyType(keyType?: PivKeyType): DigestAlgorithm {
  if (keyType === 'ECCP384') return 'SHA384';
  return 'SHA256';
}

async function verifyFirstSignature(path: string): Promise<string | undefined> {
  const document = await PdfDocument.open(path);
  for (let index = 0; index < document.fieldCount; index++) {
    const field = document.getFieldAt(index);
    if (field.fieldType === 'Signature') {
      return field.verifySignature(path);
    }
  }
  return undefined;
}

export default function SignYubiKeyExample() {
  const { lines, log } = useLog();
  const [devices, setDevices] = useState<YubiKeyDevice[]>([]);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [isUsbDiscovering, setIsUsbDiscovering] = useState(false);
  const [isNfcDiscovering, setIsNfcDiscovering] = useState(false);
  const [slot, setSlot] = useState<PivSlot>('SIGNATURE');
  const [slotMetadata, setSlotMetadata] = useState<PivSlotMetadata | null>(
    null
  );
  const [pin, setPin] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState<DigestAlgorithm>('SHA256');
  const [signatureVisibility, setSignatureVisibility] = useState<
    'invisible' | 'visible'
  >('invisible');
  const [signing, setSigning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);
  const pinInputProps = useMemo(
    () =>
      ({
        value: pin,
        onChangeText: setPin,
        secureTextEntry: true,
        keyboardType: 'number-pad',
        placeholder: 'Leave empty if already verified or not required',
      }) as object,
    [pin]
  );

  const selectedDevice = useMemo(
    () =>
      devices.find((device) => device.handle === selectedHandle) ??
      devices[0] ??
      null,
    [devices, selectedHandle]
  );

  useEffect(() => {
    setDevices(Core.getDiscoveredDevices());
    const subscription = Core.addYubiKeyListener((event) => {
      if (event.type === 'attached') {
        setDevices((current) => [
          event.device,
          ...current.filter((device) => device.handle !== event.device.handle),
        ]);
        log(`YubiKey attached over ${event.device.transport}`);
        return;
      }

      if (event.type === 'detached') {
        setDevices((current) =>
          current.filter((device) => device.handle !== event.handle)
        );
        setSelectedHandle((current) =>
          current === event.handle ? null : current
        );
        log('YubiKey detached');
        return;
      }

      log(`YubiKey error: ${event.error}`);
    });

    return () => {
      subscription.remove();
      Core.stopUsbDiscovery();
      Core.stopNfcDiscovery();
    };
  }, [log]);

  const startUsbDiscovery = useCallback(() => {
    Core.startUsbDiscovery({ handlePermissions: true });
    setIsUsbDiscovering(true);
    log('USB discovery started.');
  }, [log]);

  const stopUsbDiscovery = useCallback(() => {
    Core.stopUsbDiscovery();
    setIsUsbDiscovering(false);
    log('USB discovery stopped.');
  }, [log]);

  const startNfcDiscovery = useCallback(() => {
    Core.startNfcDiscovery({
      timeout: 120_000,
      handleUnavailableNfc: true,
    });
    setIsNfcDiscovering(true);
    log('NFC discovery started.');
  }, [log]);

  const stopNfcDiscovery = useCallback(() => {
    Core.stopNfcDiscovery();
    setIsNfcDiscovering(false);
    log('NFC discovery stopped.');
  }, [log]);

  const loadSlotMetadata = useCallback(async () => {
    if (!selectedDevice) {
      log('Attach or select a YubiKey first.');
      return;
    }

    try {
      const metadata = await Piv.getSlotMetadata(selectedDevice.handle, slot);
      setSlotMetadata(metadata);
      setHashAlgorithm(defaultHashForKeyType(metadata.keyType));
      log(
        `Slot ${slot}: ${metadata.keyType}, PIN ${metadata.pinPolicy}, touch ${metadata.touchPolicy}`
      );
    } catch (error) {
      setSlotMetadata(null);
      log(`Could not read slot metadata: ${String(error)}`);
    }
  }, [log, selectedDevice, slot]);

  const signWithYubiKey = useCallback(async () => {
    if (!doc) return;
    if (!selectedDevice) {
      log('Attach or select a YubiKey first.');
      return;
    }

    setSigning(true);
    try {
      await doc.save(unsignedPath);

      const effectiveMetadata =
        slotMetadata ??
        (await Piv.getSlotMetadata(selectedDevice.handle, slot));
      setSlotMetadata(effectiveMetadata);

      const signer = createYubiKeyPivSigner({
        deviceHandle: selectedDevice.handle,
        slot,
        keyType: effectiveMetadata.keyType,
        verifyPin: pin.trim()
          ? () => Piv.verifyPin(selectedDevice.handle, pin)
          : undefined,
      });

      await signPdf(signer, {
        inputPath: unsignedPath,
        outputPath: signedPath,
        conformanceLevel: 'B-B',
        hashAlgorithm,
        visibleTextSignature:
          signatureVisibility === 'visible'
            ? {
                pageIndex: 0,
                x: 360,
                y: 36,
                width: 210,
                height: 72,
                text: 'Digitally signed with YubiKey',
                fontName: 'Times-Roman',
                signerName: 'YubiKey PIV signer',
                reason: 'Hardware-backed PDF signature demo',
                location: 'Example app',
                contactInfo: 'demo@example.invalid',
              }
            : undefined,
      });

      log(
        `Signed with ${effectiveMetadata.keyType} in ${slot}, ${hashAlgorithm} -> ${signedPath}`
      );
      const status = await verifyFirstSignature(signedPath);
      log(
        status
          ? `Verification status: ${status}`
          : 'Verification status: no signature field found.'
      );
      setReloadKey((key) => key + 1);
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setSigning(false);
    }
  }, [
    doc,
    hashAlgorithm,
    log,
    pin,
    selectedDevice,
    signatureVisibility,
    slot,
    slotMetadata,
  ]);

  return (
    <ScrollView contentContainerStyle={layoutStyles.scrollContent}>
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <View style={layoutStyles.stack}>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. Signs with a PIV private key on a selected
            YubiKey. The PIN stays in this screen and is not stored.
          </Typography>

          <Card>
            <CardBody>
              <CardTitle>YubiKey</CardTitle>
              <CardDescription>
                Start USB or NFC discovery, then select a detected key.
              </CardDescription>
              <View style={layoutStyles.row}>
                <Button
                  style={layoutStyles.flex1}
                  variant={isUsbDiscovering ? 'secondary' : 'outline'}
                  onPress={
                    isUsbDiscovering ? stopUsbDiscovery : startUsbDiscovery
                  }
                >
                  {isUsbDiscovering ? 'Stop USB' : 'Start USB'}
                </Button>
                <Button
                  style={layoutStyles.flex1}
                  variant={isNfcDiscovering ? 'secondary' : 'outline'}
                  onPress={
                    isNfcDiscovering ? stopNfcDiscovery : startNfcDiscovery
                  }
                >
                  {isNfcDiscovering ? 'Stop NFC' : 'Start NFC'}
                </Button>
              </View>
              {devices.length === 0 ? (
                <Typography type="body-sm" color="muted">
                  No YubiKey detected yet.
                </Typography>
              ) : (
                devices.map((device) => (
                  <Button
                    key={device.handle}
                    variant={
                      selectedDevice?.handle === device.handle
                        ? 'primary'
                        : 'outline'
                    }
                    onPress={() => setSelectedHandle(device.handle)}
                  >
                    {device.transport.toUpperCase()} {device.handle}
                  </Button>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>PIV slot</CardTitle>
              <View style={styles.wrapRow}>
                {PIV_SLOTS.map((candidate) => (
                  <Button
                    key={candidate}
                    variant={slot === candidate ? 'primary' : 'outline'}
                    onPress={() => {
                      setSlot(candidate);
                      setSlotMetadata(null);
                    }}
                  >
                    {candidate}
                  </Button>
                ))}
              </View>
              <Button variant="outline" onPress={loadSlotMetadata}>
                Read slot metadata
              </Button>
              {slotMetadata && (
                <Typography type="body-sm" color="muted">
                  {slotMetadata.keyType}; PIN {slotMetadata.pinPolicy}; touch{' '}
                  {slotMetadata.touchPolicy}
                </Typography>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Signature</CardTitle>
              <View style={styles.wrapRow}>
                {HASH_ALGORITHMS.map((algorithm) => (
                  <Button
                    key={algorithm}
                    variant={
                      hashAlgorithm === algorithm ? 'primary' : 'outline'
                    }
                    onPress={() => setHashAlgorithm(algorithm)}
                  >
                    {algorithm}
                  </Button>
                ))}
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
                  Visible text
                </Button>
              </View>
              <TextField>
                <Label>PIV PIN</Label>
                <Input {...pinInputProps} />
              </TextField>
            </CardBody>
          </Card>

          <Button onPress={signWithYubiKey} isDisabled={signing}>
            {signing ? 'Signing...' : 'Sign with YubiKey'}
          </Button>
        </View>
      )}

      <LogView lines={lines} />
      {reloadKey > 0 && (
        <View style={layoutStyles.stack}>
          <SaveAsButton
            sourcePath={signedPath}
            suggestedName="yubikey-signed"
          />
          <PreviewPdfView
            key={reloadKey}
            style={layoutStyles.pdfView}
            uri={signedUri}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
