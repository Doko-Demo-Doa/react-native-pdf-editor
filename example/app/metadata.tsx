import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, Typography } from 'heroui-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PdfDocument, type PdfEncryptionInfo } from 'react-native-pdf-editor';

import { layoutStyles } from '@/styles';

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
      <Typography type="body-sm" color="muted" className="text-xs">
        {label}
      </Typography>
      <Typography type="body-sm" className="overflow-hidden">
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
          <Card.Body>
            <Card.Title>Could not read PDF</Card.Title>
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
          </Card.Body>
        </Card>
      )}

      {metadata && (
        <View style={layoutStyles.stack}>
          <Card>
            <Card.Body>
              <Card.Title>File</Card.Title>
              <MetadataRow label="Name" value={metadata.fileName} />
              <MetadataRow label="Size" value={metadata.fileSize} />
              <MetadataRow label="MIME type" value={metadata.mimeType} />
              <MetadataRow label="Modified" value={metadata.modified} />
              <MetadataRow label="URI" value={metadata.uri} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>PDF document</Card.Title>
              <MetadataRow label="Title" value={metadata.title} />
              <MetadataRow label="Author" value={metadata.author} />
              <MetadataRow label="Subject" value={metadata.subject} />
              <MetadataRow label="Creator" value={metadata.creator} />
              <MetadataRow label="Pages" value={metadata.pageCount} />
              <MetadataRow label="Form fields" value={metadata.fieldCount} />
              <MetadataRow label="Encrypted" value={metadata.encrypted} />
            </Card.Body>
          </Card>

          {metadata.encryptionInfo && (
            <Card>
              <Card.Body>
                <Card.Title>Encryption</Card.Title>
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
              </Card.Body>
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
});
