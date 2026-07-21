import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PdfDocument, type PdfSignatureInfo } from 'react-native-pdf-editor';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Typography,
} from '../src/components/ui';
import { layoutStyles } from '../src/styles';

type SignatureResult = PdfSignatureInfo & {
  index: number;
  fullName: string;
  status?: string;
};

type RowValue = string | number | boolean | number[] | undefined;

function displayValue(value: RowValue) {
  if (value === undefined || value === '') return 'Not set';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function DetailRow({ label, value }: { label: string; value: RowValue }) {
  return (
    <View style={styles.row}>
      <Typography type="body-xs" color="muted" style={styles.label}>
        {label}
      </Typography>
      <Typography type="body-sm" style={styles.value}>
        {displayValue(value)}
      </Typography>
    </View>
  );
}

function describeStatus(status: string | undefined) {
  switch (status) {
    case 'ValidNoTrust':
      return 'Valid over the signed bytes. Certificate trust is not checked.';
    case 'Invalid':
      return 'Invalid. The signed bytes do not match this signature.';
    case 'CouldNotVerify':
      return 'Could not verify. The signature or byte range could not be processed.';
    default:
      return 'Not checked yet.';
  }
}

export default function VerifySignatureExample() {
  const [fileName, setFileName] = useState<string | undefined>();
  const [signatures, setSignatures] = useState<SignatureResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPdf = useCallback(async () => {
    setError(null);
    setSignatures([]);
    setFileName(undefined);

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setLoading(true);
    setFileName(asset.name);

    try {
      const path = asset.uri.replace(/^file:\/\//, '');
      const document = await PdfDocument.open(path);
      const found: SignatureResult[] = [];

      for (let index = 0; index < document.fieldCount; index++) {
        const field = document.getFieldAt(index);
        if (field.fieldType !== 'Signature') continue;

        const info = field.getSignatureInfo();
        if (!info.hasSignatureValue) continue;

        const status = await field.verifySignature(path);
        found.push({
          ...info,
          index,
          fullName: field.fullName,
          status,
        });
      }

      setSignatures(found);
    } catch (value) {
      setError(String(value));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={layoutStyles.stack}>
        <Typography type="body-sm" color="muted">
          Pick a signed PDF to inspect signature fields and verify whether each
          signature matches the signed document bytes.
        </Typography>
        <Button onPress={pickPdf} isDisabled={loading}>
          {loading ? 'Checking signatures...' : 'Pick a signed PDF'}
        </Button>
      </View>

      {fileName && (
        <Card>
          <CardBody>
            <CardTitle>{fileName}</CardTitle>
            <Typography type="body-sm" color="muted">
              {loading
                ? 'Reading PDF signatures...'
                : `${signatures.length} signature field${
                    signatures.length === 1 ? '' : 's'
                  } found`}
            </Typography>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card>
          <CardBody>
            <CardTitle>Could not verify signatures</CardTitle>
            <Typography type="body-sm" style={styles.error}>
              {error}
            </Typography>
          </CardBody>
        </Card>
      )}

      {signatures.map((signature) => (
        <Card key={`${signature.index}-${signature.fullName}`}>
          <CardBody>
            <CardTitle>
              {signature.fullName || `Signature ${signature.index}`}
            </CardTitle>
            <Typography type="body-sm" color="muted">
              {describeStatus(signature.status)}
            </Typography>
            <DetailRow label="Status" value={signature.status} />
            <DetailRow label="Has value" value={signature.hasSignatureValue} />
            <DetailRow label="Signer name" value={signature.signerName} />
            <DetailRow label="Reason" value={signature.reason} />
            <DetailRow label="Location" value={signature.location} />
            <DetailRow label="Contact info" value={signature.contactInfo} />
            <DetailRow label="Signing date" value={signature.signingDate} />
            <DetailRow label="Filter" value={signature.filter} />
            <DetailRow label="Sub-filter" value={signature.subFilter} />
            <DetailRow label="Type" value={signature.type} />
            <DetailRow label="Byte range" value={signature.byteRange} />
          </CardBody>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  row: {
    gap: 4,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e6ed',
  },
  label: {
    fontSize: 12,
  },
  value: {
    overflow: 'hidden',
  },
  error: {
    color: '#b42318',
  },
});
