import type { PdfSignatureInfo } from 'react-native-pdf-editor';

import { Button, Card, Typography } from 'heroui-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { layoutStyles } from '@/styles';
import { useSourceDocument } from '@/utils/useSourceDocument';

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
      <Typography type="body-xs" color="muted" className="text-xs">
        {label}
      </Typography>
      <Typography type="body-sm" className="overflow-hidden">
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
  const { pickFile, loading } = useSourceDocument();

  const pickPdf = useCallback(async () => {
    setError(null);
    setSignatures([]);
    setFileName(undefined);

    const picked = await pickFile();
    if (!picked) return;
    setFileName(picked.name);

    if (!picked.doc) {
      setError(picked.error ?? 'Unknown error');
      return;
    }

    try {
      const { doc, path } = picked;
      const found: SignatureResult[] = [];

      for (let index = 0; index < doc.fieldCount; index++) {
        const field = doc.getFieldAt(index);
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
    }
  }, [pickFile]);

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
          <Card.Body>
            <Card.Title>{fileName}</Card.Title>
            <Typography type="body-sm" color="muted">
              {loading
                ? 'Reading PDF signatures...'
                : `${signatures.length} signature field${
                    signatures.length === 1 ? '' : 's'
                  } found`}
            </Typography>
          </Card.Body>
        </Card>
      )}

      {error && (
        <Card>
          <Card.Body>
            <Card.Title>Could not verify signatures</Card.Title>
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
          </Card.Body>
        </Card>
      )}

      {signatures.map((signature) => (
        <Card key={`${signature.index}-${signature.fullName}`}>
          <Card.Body>
            <Card.Title>
              {signature.fullName || `Signature ${signature.index}`}
            </Card.Title>
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
          </Card.Body>
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
});
