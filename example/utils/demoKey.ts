import forge from 'node-forge';
import { generateKeyPairSync } from 'react-native-quick-crypto';
import type { DigestAlgorithm } from 'react-native-pdf-editor/signing';

export interface DemoKeyAndCert {
  /** PEM-encoded RSA private key - keep this secret. */
  privateKeyPem: string;
  /** Flat base64 DER certificate, leaf-first, matching `Signer.getCertificateChain`'s shape. */
  certificateChain: string[];
}

/**
 * Generates a fresh RSA-2048 keypair and a self-signed X.509 certificate for
 * it - good enough for demonstrating the `Signer` interface, not for
 * anything that needs a real chain of trust.
 *
 * Key generation (a large-prime search) is the expensive part - tens of
 * seconds in `node-forge`'s pure-JS implementation on some devices - so it
 * runs on `react-native-quick-crypto`'s native (Nitro/OpenSSL-backed) one
 * instead, which is close to instant. Everything else here (building the
 * X.509 structure, self-signing it) is cheap regardless of implementation -
 * no large-number search involved - so it stays on `node-forge`, which
 * already has a mature certificate builder `react-native-quick-crypto`
 * doesn't provide. `forge.pki.privateKeyFromPem`/`publicKeyFromPem` accept
 * the PKCS8/SPKI PEM `react-native-quick-crypto` produces directly - this is
 * the same interop `node-forge` itself uses internally when Node's native
 * `crypto.generateKeyPairSync` is available instead of its own pure-JS one.
 */
export function generateDemoKeyAndCert(commonName: string): DemoKeyAndCert {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicExponent: 0x10001,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  }) as { publicKey: string; privateKey: string };

  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.publicKeyFromPem(publicKey);
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{ name: 'commonName', value: commonName }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(forge.pki.privateKeyFromPem(privateKey), forge.md.sha256.create());

  const certificateDer = forge.asn1
    .toDer(forge.pki.certificateToAsn1(cert))
    .getBytes();

  return {
    privateKeyPem: privateKey,
    certificateChain: [forge.util.encode64(certificateDer)],
  };
}

/**
 * Signs a `DigestInfo`-wrapped payload with a PEM-encoded RSA private key,
 * matching what `createSigner({ keyAlgorithm: 'RSA', ... }).rawSign` expects
 * to receive: the payload is already the full ASN.1 `DigestInfo`, not a raw
 * hash, so this must do the PKCS#1 v1.5 padding + raw RSA private-key
 * operation directly - not forge's higher-level `privateKey.sign(md)`, which
 * would wrap its own `DigestInfo` around the payload a second time.
 */
export async function signWithDemoKey(
  privateKeyPem: string,
  payloadBase64: string,
  _algorithm: DigestAlgorithm
): Promise<string> {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const payload = forge.util.decode64(payloadBase64);
  // Block type 0x01 = PKCS#1 v1.5 private-key (signing) padding. This is
  // forge's deprecated low-level API (real at runtime, but omitted from
  // @types/node-forge, hence the cast), and it's the only one that signs
  // exactly the bytes given rather than re-deriving its own DigestInfo.
  const rsa = forge.pki.rsa as unknown as {
    encrypt(m: string, key: forge.pki.rsa.PrivateKey, bt: number): string;
  };
  const signature = rsa.encrypt(payload, privateKey, 0x01);
  return forge.util.encode64(signature);
}
