import { Platform } from 'react-native';
import { fromByteArray, toByteArray } from 'react-native-quick-base64';
import type { DigestAlgorithm, Signer } from 'react-native-pdf-editor/signing';
import { RSA_PKCS1_DIGEST_INFO_PREFIX_HEX } from 'react-native-pdf-editor/signing';
import { Piv } from '@doko/react-native-yubikit';
import type { PivKeyType, PivSlot } from '@doko/react-native-yubikit';

type PdfSignerKeyAlgorithm = 'RSA' | 'EC';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function wrapDigestInfo(
  digestBase64: string,
  algorithm: DigestAlgorithm
): string {
  return fromByteArray(
    concatBytes(
      hexToBytes(RSA_PKCS1_DIGEST_INFO_PREFIX_HEX[algorithm]),
      toByteArray(digestBase64)
    )
  );
}

export interface YubiKeyPivSignerOptions {
  deviceHandle: string;
  slot: PivSlot;
  keyType?: PivKeyType;
  certificateChain?: string[] | (() => Promise<string[]>);
  intermediateCertificates?: string[];
  verifyPin?: () => Promise<void>;
  rawTimestamp?: (
    messageImprintBase64: string,
    algorithm: DigestAlgorithm
  ) => Promise<string>;
}

function keyAlgorithmForPivKeyType(keyType: PivKeyType): PdfSignerKeyAlgorithm {
  if (keyType.startsWith('RSA')) {
    return 'RSA';
  }

  if (keyType === 'ECCP256' || keyType === 'ECCP384') {
    return 'EC';
  }

  throw new Error(
    `PIV key type "${keyType}" is not supported for PDF signing in this example.`
  );
}

function validatePlatformSupport(keyType: PivKeyType) {
  if (
    Platform.OS === 'ios' &&
    (keyType === 'RSA3072' || keyType === 'RSA4096')
  ) {
    throw new Error(
      `${keyType} raw signing is not supported by the current YubiKit iOS PIV wrapper.`
    );
  }
}

function assertDigestCompatible(
  keyType: PivKeyType,
  algorithm: DigestAlgorithm
) {
  if (keyType === 'ECCP256' && algorithm !== 'SHA256') {
    throw new Error(
      'ECCP256 PDF signing in this example requires SHA256 until other digest combinations are verified.'
    );
  }

  if (keyType === 'ECCP384' && algorithm !== 'SHA384') {
    throw new Error(
      'ECCP384 PDF signing in this example requires SHA384 until other digest combinations are verified.'
    );
  }
}

export function createYubiKeyPivSigner(
  options: YubiKeyPivSignerOptions
): Signer {
  let resolvedKeyType: PivKeyType | undefined = options.keyType;
  let hasVerifiedPin = false;

  async function getKeyType(): Promise<PivKeyType> {
    if (!resolvedKeyType) {
      const metadata = await Piv.getSlotMetadata(
        options.deviceHandle,
        options.slot
      );
      resolvedKeyType = metadata.keyType;
    }

    validatePlatformSupport(resolvedKeyType);
    return resolvedKeyType;
  }

  async function getCertificateChain(): Promise<string[]> {
    if (typeof options.certificateChain === 'function') {
      return options.certificateChain();
    }

    if (options.certificateChain) {
      return options.certificateChain;
    }

    const leafCertificate = await Piv.getCertificate(
      options.deviceHandle,
      options.slot
    );
    return [leafCertificate, ...(options.intermediateCertificates ?? [])];
  }

  return {
    getCertificateChain,
    async sign(digestBase64, algorithm) {
      const keyType = await getKeyType();
      const keyAlgorithm = keyAlgorithmForPivKeyType(keyType);
      assertDigestCompatible(keyType, algorithm);

      if (options.verifyPin && !hasVerifiedPin) {
        await options.verifyPin();
        hasVerifiedPin = true;
      }

      const payloadBase64 =
        keyAlgorithm === 'RSA'
          ? wrapDigestInfo(digestBase64, algorithm)
          : digestBase64;

      return Piv.rawSignOrDecrypt(
        options.deviceHandle,
        options.slot,
        keyType,
        payloadBase64
      );
    },
    ...(options.rawTimestamp
      ? {
          async timestamp(
            messageImprintBase64: string,
            algorithm: DigestAlgorithm
          ) {
            return options.rawTimestamp!(messageImprintBase64, algorithm);
          },
        }
      : {}),
  };
}
