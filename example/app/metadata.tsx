import type {
  PdfDocument as PdfDocumentInstance,
  PdfEncryptionInfo,
} from 'react-native-pdf-editor';

import { Card, Typography } from 'heroui-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useSourceDocument } from '@/utils/useSourceDocument';

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
    <View className="gap-1 border-b border-border py-1.75">
      <Typography type="body-sm" color="muted" className="text-xs">
        {label}
      </Typography>
      <Typography type="body-sm" className="overflow-hidden">
        {displayValue(value)}
      </Typography>
    </View>
  );
}

function readDocMetadata(
  doc: PdfDocumentInstance,
  base: Partial<Metadata> = {}
): Metadata {
  const encryptionInfo = doc.getEncryptionInfo();
  return {
    ...base,
    title: doc.getTitle(),
    author: doc.getAuthor(),
    subject: doc.getSubject(),
    creator: doc.getCreator(),
    pageCount: doc.pageCount,
    fieldCount: doc.fieldCount,
    encrypted: encryptionInfo !== undefined,
    encryptionInfo,
  };
}

export default function MetadataExample() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { doc, sourceLabel } = useSourceDocument();
  // Tracks the last `doc` already reflected in `metadata`, so the effect below
  // doesn't clobber `pickPdf`'s richer (file size/mimeType/uri) result with
  // this plain sourceLabel-only version once picking updates the same store.
  const lastHandledDoc = useRef<PdfDocumentInstance | null>(null);

  useEffect(() => {
    if (!doc || doc === lastHandledDoc.current) return;
    lastHandledDoc.current = doc;
    setError(null);
    setMetadata(readDocMetadata(doc, { fileName: sourceLabel ?? undefined }));
  }, [doc, sourceLabel]);

  return (
    <ScrollView className="bg-background" contentContainerClassName="gap-3 p-4">
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
        <View className="gap-3">
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
