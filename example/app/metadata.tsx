import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Typography,
} from '../src/components/ui';
import { PdfDocument, type PdfEncryptionInfo } from 'react-native-pdf-editor';
import { layoutStyles } from '../src/styles';

type MetadataValue = string | number | boolean | undefined;

type Metadata = {
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  modified?: string;
  uri?: string;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  pageCount?: number;
  fieldCount?: number;
  encrypted?: boolean;
  encryptionInfo?: PdfEncryptionInfo;
};

type MetadataRowProps = {
  label: string;
  value: MetadataValue;
};

function displayValue(value: MetadataValue) {
  if (value === undefined || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <View style={styles.row}>
      <Typography type="body-sm" color="muted" style={styles.label}>
        {label}
      </Typography>
      <Typography type="body-sm" style={styles.value}>
        {displayValue(value)}
      </Typography>
    </View>
  );
}

export default function MetadataExample() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPdf = useCallback(async () => {
    setError(null);
    setMetadata(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setLoading(true);
    const fileMetadata: Metadata = {
      fileName: asset.name,
      fileSize: asset.size === undefined ? undefined : `${asset.size} bytes`,
      mimeType: asset.mimeType,
      modified:
        asset.lastModified === undefined
          ? undefined
          : new Date(asset.lastModified).toLocaleString(),
      uri: asset.uri,
    };
    setMetadata(fileMetadata);

    try {
      const path = asset.uri.replace(/^file:\/\//, '');
      const document = await PdfDocument.open(path);
      const encryptionInfo = document.getEncryptionInfo();
      setMetadata({
        ...fileMetadata,
        title: document.getTitle(),
        author: document.getAuthor(),
        subject: document.getSubject(),
        creator: document.getCreator(),
        pageCount: document.pageCount,
        fieldCount: document.fieldCount,
        encrypted: encryptionInfo !== undefined,
        encryptionInfo,
      });
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
          Pick a PDF to inspect its file information and metadata exposed by the
          native document API.
        </Typography>
        <Button onPress={pickPdf} isDisabled={loading}>
          {loading ? 'Reading metadata...' : 'Pick a PDF file'}
        </Button>
      </View>

      {error && (
        <Card>
          <CardBody>
            <CardTitle>Could not read PDF</CardTitle>
            <Typography type="body-sm" style={styles.error}>
              {error}
            </Typography>
          </CardBody>
        </Card>
      )}

      {metadata && (
        <View style={layoutStyles.stack}>
          <Card>
            <CardBody>
              <CardTitle>File</CardTitle>
              <MetadataRow label="Name" value={metadata.fileName} />
              <MetadataRow label="Size" value={metadata.fileSize} />
              <MetadataRow label="MIME type" value={metadata.mimeType} />
              <MetadataRow label="Modified" value={metadata.modified} />
              <MetadataRow label="URI" value={metadata.uri} />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>PDF document</CardTitle>
              <MetadataRow label="Title" value={metadata.title} />
              <MetadataRow label="Author" value={metadata.author} />
              <MetadataRow label="Subject" value={metadata.subject} />
              <MetadataRow label="Creator" value={metadata.creator} />
              <MetadataRow label="Pages" value={metadata.pageCount} />
              <MetadataRow label="Form fields" value={metadata.fieldCount} />
              <MetadataRow label="Encrypted" value={metadata.encrypted} />
            </CardBody>
          </Card>

          {metadata.encryptionInfo && (
            <Card>
              <CardBody>
                <CardTitle>Encryption</CardTitle>
                <MetadataRow
                  label="Algorithm"
                  value={metadata.encryptionInfo.algorithm}
                />
                <MetadataRow
                  label="Key length"
                  value={`${metadata.encryptionInfo.keyLengthBits} bits`}
                />
                <MetadataRow
                  label="Revision"
                  value={metadata.encryptionInfo.revision}
                />
                <MetadataRow
                  label="Metadata encrypted"
                  value={metadata.encryptionInfo.metadataEncrypted}
                />
                <MetadataRow
                  label="Parsed"
                  value={metadata.encryptionInfo.parsed}
                />
                <MetadataRow
                  label="Owner password set"
                  value={metadata.encryptionInfo.ownerPasswordSet}
                />
                <MetadataRow
                  label="Print"
                  value={metadata.encryptionInfo.permissions.print}
                />
                <MetadataRow
                  label="Copy"
                  value={metadata.encryptionInfo.permissions.copy}
                />
                <MetadataRow
                  label="Edit"
                  value={metadata.encryptionInfo.permissions.edit}
                />
                <MetadataRow
                  label="Edit notes"
                  value={metadata.encryptionInfo.permissions.editNotes}
                />
                <MetadataRow
                  label="Fill and sign"
                  value={metadata.encryptionInfo.permissions.fillAndSign}
                />
                <MetadataRow
                  label="Accessible"
                  value={metadata.encryptionInfo.permissions.accessible}
                />
                <MetadataRow
                  label="Document assembly"
                  value={metadata.encryptionInfo.permissions.docAssembly}
                />
                <MetadataRow
                  label="High-resolution print"
                  value={metadata.encryptionInfo.permissions.highPrint}
                />
              </CardBody>
            </Card>
          )}
        </View>
      )}
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
