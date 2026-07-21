import type { HybridObject } from 'react-native-nitro-modules';

/** Matches PoDoFo's own PdfFieldType names. */
export type PdfFieldType =
  | 'Unknown'
  | 'PushButton'
  | 'CheckBox'
  | 'RadioButton'
  | 'TextBox'
  | 'ComboBox'
  | 'ListBox'
  | 'Signature';

/**
 * Result of {@linkcode PdfField.verifySignature}.
 *
 * `ValidNoTrust` means the signature cryptographically matches the signed
 * document bytes and embedded certificate. It does not mean the certificate
 * chain is trusted or that revocation status was checked.
 */
export type PdfSignatureVerificationStatus =
  | 'CouldNotVerify'
  | 'Invalid'
  | 'ValidNoTrust';

/**
 * Dictionary-level information from a signed PDF signature field.
 *
 * Exposed by {@linkcode PdfField.getSignatureInfo}. These values are declared
 * by the PDF signature dictionary and signing CMS container; they are useful
 * for inspection, but trust decisions require {@linkcode PdfField.verifySignature}
 * plus separate certificate-chain and revocation validation.
 */
export interface PdfSignatureInfo {
  /** Whether the signature field has a `/Contents` value. */
  hasSignatureValue: boolean;
  /** Signature handler filter, for example `Adobe.PPKLite`. */
  filter?: string;
  /** Signature sub-filter, for example `ETSI.CAdES.detached`. */
  subFilter?: string;
  /** Signature value type, for example `Sig` or `DocTimeStamp`. */
  type?: string;
  /** Signer name declared in the PDF signature dictionary. */
  signerName?: string;
  /** Signature reason declared in the PDF signature dictionary. */
  reason?: string;
  /** Signature location declared in the PDF signature dictionary. */
  location?: string;
  /** Signature contact info declared in the PDF signature dictionary. */
  contactInfo?: string;
  /** Claimed signing date from the PDF signature dictionary, in W3C format. */
  signingDate?: string;
  /** Raw `/ByteRange` values. */
  byteRange?: number[];
}

/**
 * A single AcroForm field (text box, checkbox, radio button, push button,
 * combo/list box, or signature field) — wraps PoDoFo's PdfField hierarchy.
 * Rather than a type per field subclass, this is one type for all field
 * types; `getText`/`setText` and `isChecked`/`setChecked` throw if called
 * on a field of the wrong type (checked natively via dynamic_cast).
 *
 * Owned by the document's AcroForm — no public constructor.
 */
export interface PdfField extends HybridObject<{
  ios: 'c++';
  android: 'kotlin';
}> {
  readonly fieldType: PdfFieldType;

  /** The fully qualified field name (parent names joined with '.'). */
  readonly fullName: string;

  /** @throws if this field isn't a TextBox */
  getText(): string | undefined;
  /** @throws if this field isn't a TextBox */
  setText(text: string | undefined): void;

  /** @throws if this field isn't a CheckBox/RadioButton */
  isChecked(): boolean;
  /** @throws if this field isn't a CheckBox/RadioButton */
  setChecked(checked: boolean): void;

  /**
   * Returns signature metadata for a signature field.
   *
   * @throws if this field isn't a Signature field
   */
  getSignatureInfo(): PdfSignatureInfo;

  /**
   * Cryptographically verifies this signature against the PDF file bytes at
   * `documentPath`.
   *
   * This checks whether the signed byte ranges match the embedded signature.
   * It does not validate the signer's certificate chain, revocation status, or
   * trust anchor.
   *
   * @throws if this field isn't a Signature field
   */
  verifySignature(
    documentPath: string
  ): Promise<PdfSignatureVerificationStatus>;
}
