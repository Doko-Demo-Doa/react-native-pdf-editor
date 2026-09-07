import { Platform } from 'react-native';
import { fromByteArray, toByteArray } from 'react-native-quick-base64';
import type { DigestAlgorithm, Signer } from 'react-native-pdf-editor/signing';
import { RSA_PKCS1_DIGEST_INFO_PREFIX_HEX } from 'react-native-pdf-editor/signing';
import { Core, Piv } from '@doko/react-native-yubikit';
import type { PivKeyType, PivSlot } from '@doko/react-native-yubikit';

type PdfSignerKeyAlgorithm = 'RSA' | 'EC';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Modulus byte length for each RSA PIV key type - the EMSA-PKCS1-v1_5 block
// below must be exactly this many bytes.
const RSA_MODULUS_BYTE_LENGTH: Partial<Record<PivKeyType, number>> = {
  RSA1024: 128,
  RSA2048: 256,
  RSA3072: 384,
  RSA4096: 512,
};

// `Piv.rawSignOrDecrypt` zero-pads bare DigestInfo instead of applying real
// EMSA-PKCS1-v1_5 padding (`00 01 FF...FF 00 DigestInfo`), so build it here.
function buildPkcs1v15Block(
  digestBase64: string,
  algorithm: DigestAlgorithm,
  keyType: PivKeyType
): string {
  const digestInfoPrefix = hexToBytes(
    RSA_PKCS1_DIGEST_INFO_PREFIX_HEX[algorithm]
  );
  const digest = toByteArray(digestBase64);
  const emLen = RSA_MODULUS_BYTE_LENGTH[keyType];
  if (!emLen) {
    throw new Error(
      `Unknown RSA modulus byte length for key type "${keyType}".`
    );
  }

  const tLen = digestInfoPrefix.length + digest.length;
  const psLen = emLen - tLen - 3;
  if (psLen < 8) {
    throw new Error(
      `RSA key type "${keyType}" is too small to hold a ${algorithm} DigestInfo with valid EMSA-PKCS1-v1_5 padding.`
    );
  }

  const block = new Uint8Array(emLen);
  block[0] = 0x00;
  block[1] = 0x01;
  block.fill(0xff, 2, 2 + psLen);
  block[2 + psLen] = 0x00;
  block.set(digestInfoPrefix, 3 + psLen);
  block.set(digest, 3 + psLen + digestInfoPrefix.length);
  return fromByteArray(block);
}

export interface YubiKeyPivSignerOptions {
  deviceHandle: string;
  slot: PivSlot;
  keyType?: PivKeyType;
  certificateChain?: string[] | (() => Promise<string[]>);
  intermediateCertificates?: string[];
  /** Called with the open connectionHandle; pass it to `Piv.verifyPin`. */
  verifyPin?: (connectionHandle: string) => Promise<void>;
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

  // On Android, PIN verification is scoped to the connection, not the device -
  // hold one open across calls so it survives through to rawSignOrDecrypt.
  let connectionHandle: string | null = null;

  async function ensureConnection(): Promise<string> {
    if (!connectionHandle) {
      connectionHandle = await Core.requestConnection(
        options.deviceHandle,
        'SmartCardConnection'
      );
    }
    return connectionHandle;
  }

  function releaseConnection() {
    if (connectionHandle) {
      Core.closeConnection(connectionHandle);
      connectionHandle = null;
    }
  }

  async function getKeyType(connection: string): Promise<PivKeyType> {
    if (!resolvedKeyType) {
      const metadata = await Piv.getSlotMetadata(
        options.deviceHandle,
        options.slot,
        connection
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

    const connection = await ensureConnection();
    const leafCertificate = await Piv.getCertificate(
      options.deviceHandle,
      options.slot,
      connection
    );
    return [leafCertificate, ...(options.intermediateCertificates ?? [])];
  }

  return {
    getCertificateChain,
    async sign(digestBase64, algorithm) {
      try {
        const connection = await ensureConnection();
        const keyType = await getKeyType(connection);
        const keyAlgorithm = keyAlgorithmForPivKeyType(keyType);
        assertDigestCompatible(keyType, algorithm);

        if (options.verifyPin && !hasVerifiedPin) {
          await options.verifyPin(connection);
          hasVerifiedPin = true;
        }

        const payloadBase64 =
          keyAlgorithm === 'RSA'
            ? buildPkcs1v15Block(digestBase64, algorithm, keyType)
            : digestBase64;

        return await Piv.rawSignOrDecrypt(
          options.deviceHandle,
          options.slot,
          keyType,
          payloadBase64,
          connection
        );
      } finally {
        releaseConnection();
      }
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
