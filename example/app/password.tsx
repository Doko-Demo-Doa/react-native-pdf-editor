import { Button, Input, Label, TextField, Typography } from 'heroui-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';
import { LogView } from '../src/components/LogView';
import { SaveAsButton } from '../src/components/SaveAsButton';
import { SourcePicker } from '../src/components/SourcePicker';
import { demoPdfPath } from '../src/lib/pdf';
import { useLog } from '../src/lib/useLog';
import { useSourceDocument } from '../src/lib/useSourceDocument';

const { path } = demoPdfPath('password');

function createSample() {
  const doc = PdfDocument.create();
  const page = doc.createPage(612, 300);
  const painter = page.createPainter();
  painter.setNonStrokingColorRGB(1, 1, 1);
  painter.drawRectangle(0, 0, 612, 300, true);
  painter.setNonStrokingColorRGB(0, 0, 0);
  const font = doc.getStandard14Font('Helvetica');
  painter.setFont(font, 20);
  painter.drawText('This document will be password-protected', 40, 220);
  painter.finishDrawing();
  return doc;
}

export default function PasswordExample() {
  const { lines, log } = useLog();
  const { doc, sourceLabel, useSample, pickFile } =
    useSourceDocument(createSample);
  const [userPassword, setUserPassword] = useState('open-secret');
  const [ownerPassword, setOwnerPassword] = useState('owner-secret');
  const [encrypting, setEncrypting] = useState(false);
  const [encryptedPath, setEncryptedPath] = useState<string | null>(null);
  const [tryPassword, setTryPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const encrypt = useCallback(async () => {
    if (!doc) return;
    setEncrypting(true);
    try {
      // Restricting `print`/`copy` here as a visible example of the
      // permission bits `setEncrypted` accepts alongside the passwords -
      // the rest (edit, annotate, fill forms, etc.) default to granted.
      doc.setEncrypted(userPassword, ownerPassword || userPassword, {
        print: false,
        copy: false,
      });
      await doc.save(path);
      log(
        `Encrypted -> ${path} (isEncrypted: ${doc.isEncrypted()}). Printing and copying are disallowed; opening requires the user password.`
      );
      setEncryptedPath(path);
    } catch (error) {
      log(`Error: ${String(error)}`);
    } finally {
      setEncrypting(false);
    }
  }, [doc, userPassword, ownerPassword, log]);

  const verify = useCallback(async () => {
    if (!encryptedPath) return;
    setVerifying(true);
    try {
      const opened = await PdfDocument.open(encryptedPath, tryPassword);
      log(
        `Opened successfully with password "${tryPassword}" (${opened.pageCount} page(s)).`
      );
    } catch (error) {
      log(`Failed to open with password "${tryPassword}": ${String(error)}`);
    } finally {
      setVerifying(false);
    }
  }, [encryptedPath, tryPassword, log]);

  return (
    <View className="flex-1 gap-3 p-4">
      {!doc ? (
        <SourcePicker onUseSample={useSample} onPickFile={pickFile} />
      ) : (
        <>
          <Typography type="body-sm" color="muted">
            Source: {sourceLabel}. `doc.setEncrypted(userPassword,
            ownerPassword, permissions)` encrypts on the next `save` - {"''"} as
            the user password means anyone can open it, but the owner password
            is still required to change permissions.
          </Typography>
          <TextField>
            <Label>User password</Label>
            <Input
              value={userPassword}
              onChangeText={setUserPassword}
              placeholder="Required to open"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>
          <TextField>
            <Label>Owner password</Label>
            <Input
              value={ownerPassword}
              onChangeText={setOwnerPassword}
              placeholder="Required to change permissions"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>
          <Button onPress={encrypt} isDisabled={encrypting}>
            {encrypting ? 'Encrypting...' : 'Encrypt & save'}
          </Button>
        </>
      )}
      <LogView lines={lines} />
      {encryptedPath && (
        <>
          <Typography type="body-sm" color="muted">
            PDF viewers can't preview an encrypted file without its password, so
            verify the round trip directly: type a password and try reopening
            the saved file with it.
          </Typography>
          <TextField>
            <Label>Password to try</Label>
            <Input
              value={tryPassword}
              onChangeText={setTryPassword}
              placeholder="Password to try"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>
          <Button variant="secondary" onPress={verify} isDisabled={verifying}>
            {verifying ? 'Opening...' : 'Try reopening with password'}
          </Button>
          <SaveAsButton sourcePath={encryptedPath} suggestedName="password" />
        </>
      )}
    </View>
  );
}
