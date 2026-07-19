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
}
