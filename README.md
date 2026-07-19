# react-native-pdf-editor

A React Native wrapper around a [PoDoFo](https://github.com/Doko-Demo-Doa/podofo) fork for creating, editing, and digitally signing PDFs (PAdES B-B/B-T/B-LT/B-LTA) on iOS and Android.

[![npm version](https://img.shields.io/npm/v/@doko/react-native-pdf-editor?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@doko/react-native-pdf-editor)
[![Monthly downloads](https://img.shields.io/npm/dm/@doko/react-native-pdf-editor?style=for-the-badge)](https://www.npmjs.com/package/@doko/react-native-pdf-editor)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-Only-5f3dc4?style=for-the-badge)](https://reactnative.dev/docs/the-new-architecture/landing-page)
[![TypeScript](https://img.shields.io/badge/TypeScript-Supported-3178C6?style=for-the-badge)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f9e44?style=for-the-badge)](LICENSE)
[![iOS](https://img.shields.io/badge/iOS-15.1%2B-000000?style=for-the-badge&logo=apple)](https://developer.apple.com/ios/)
[![Android](https://img.shields.io/badge/Android-API%2026%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)

---

## Features

- 📄 **Document editing** - create, open, save; page add/remove; standard-14 fonts, custom/embedded TTF fonts via `loadFont`/`loadFontFromBuffer`, images, vector shapes via `PdfPainter`
- 🖊️ **Annotations & form fields** - highlight/freetext/stamp/ink/link annotations; text box & checkbox AcroForm fields
- 🔒 **Encryption** - AES-256 owner/user passwords with per-permission flags (print, copy, fill-and-sign, ...)
- ✍️ **Signer-agnostic PAdES signing** - a plain `Signer` interface (`getCertificateChain`/`sign`/`timestamp`) drives signing, so YubiKey, an HSM, GoTrust, a cloud KMS, or an in-memory dev key are all pluggable without the core library knowing which
- ⏱️ **Full PAdES baseline ladder** - B-B, B-T (RFC3161 timestamp), B-LT (DSS/LTV), B-LTA (archival timestamp) via `signPdf`
- 🖼️ **Page rendering & text extraction** - `renderPageToBitmap` (Core Graphics / `PdfRenderer`) returns a zero-copy `ArrayBuffer`; `extractText` for content-stream text (with regex search)
- 🧩 **Two entry points** - `react-native-pdf-editor` for document/painting/forms, `react-native-pdf-editor/signing` for everything signing-related, kept separate so apps that only edit PDFs don't pull in signing concepts they don't need
- 🆕 **New Architecture only** - built as a [Nitro Module](https://nitro.margelo.com/), C++ core on iOS, Kotlin on Android

---

## Platform support

Android and iOS are **not** at parity - this is a deliberate, documented consequence of what's actually bindable on each platform today, not an oversight. iOS binds Nitro's C++ layer directly to PoDoFo's core; Android binds Kotlin to the already-published `podofo-android` JNI wrapper, which exposes a narrower surface (confirmed by reading its actual source before every phase).

| Feature                                              | Android                                                                   | iOS                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| Document create/open/save, page add/remove           | Full                                                                      | Full                                          |
| Page rotate/resize/reorder, merge/split              | Not bound                                                                 | Not bound (spec doesn't expose it either yet) |
| Painter (text/images/shapes), annotations            | Full                                                                      | Full                                          |
| Custom/embedded TTF fonts (from a file path)         | Full (pixel-verified)                                                     | Full (build-verified)                         |
| Custom/embedded TTF fonts (from an in-memory buffer) | Full (build-verified)                                                     | Full (build-verified)                         |
| AcroForm fields (text box, checkbox)                 | Full                                                                      | Full                                          |
| Radio/combo/list-box/signature fields, flattening    | Not bound                                                                 | Not bound                                     |
| Encryption                                           | Full                                                                      | Full                                          |
| Signing (B-B/B-T/B-LT/B-LTA)                         | Full, **except** `rootCertificate` (throws - see below)                   | Full                                          |
| Page rendering, text extraction                      | Full (compiles + build-verified; not pixel-tested on-device this session) | Full (pixel-verified)                         |

`PdfSigningSessionOptions.rootCertificate` throws `UnsupportedOperationException` on Android: the published `PoDoFoWrapper` constructor has no root-certificate parameter at all.

---

## Requirements

|              | Minimum                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| React Native | 0.79+ with the **New Architecture enabled** ([Nitro Modules](https://nitro.margelo.com/) requirement) |
| iOS          | 15.1+                                                                                                 |
| Android      | `minSdkVersion` 26 (the published `podofo-android` AAR's own manifest requires it)                    |

---

## Installation

```sh
npm install @doko/react-native-pdf-editor react-native-nitro-modules
# or
yarn add @doko/react-native-pdf-editor react-native-nitro-modules
# or
pnpm add @doko/react-native-pdf-editor react-native-nitro-modules
```

> `react-native-nitro-modules` is required as this library relies on [Nitro Modules](https://nitro.margelo.com/).

If your app's `minSdkVersion` is below 26, raise it (e.g. via `expo-build-properties`'s `android.minSdkVersion` in an Expo-managed app) - PoDoFo's own Android manifest requires it, and the manifest merger will fail otherwise.

---

## Quick start

```ts
import { PdfDocument, renderPageToBitmap } from '@doko/react-native-pdf-editor';

const doc = PdfDocument.create();
// or open an existing file: const doc = await PdfDocument.open('/path/to/existing.pdf');
// (pass a password as a second argument if it's encrypted)
const page = doc.createPage(612, 792);

const painter = page.createPainter();
const font = doc.getStandard14Font('Helvetica');
// or embed your own: const font = doc.loadFont('/path/to/font.ttf');
painter.setFont(font, 24);
painter.drawText('Hello from react-native-pdf-editor!', 50, 700);
painter.finishDrawing();

await doc.save('/path/to/output.pdf');

const bitmap = await renderPageToBitmap({
  path: '/path/to/output.pdf',
  pageIndex: 0,
});
// bitmap.data is a zero-copy ArrayBuffer, RGBA8888, bitmap.width x bitmap.height
```

Signing lives on its own entry point:

```ts
import { signPdf, createSigner } from '@doko/react-native-pdf-editor/signing';

const signer = createSigner({
  keyAlgorithm: 'RSA',
  certificateChain: [/* base64 DER, leaf-first */],
  rawSign: async (payloadBase64, algorithm) => {
    // back this with whatever holds the private key: an in-memory dev key
    // via react-native-quick-crypto, a PKCS#11 C_Sign, YubiKit PIV, an HSM,
    // GoTrust, a cloud KMS, ... - see the Signer interface for the shape.
    return mySign(payloadBase64, algorithm);
  },
});

await signPdf(signer, {
  inputPath: '/path/to/output.pdf',
  outputPath: '/path/to/signed.pdf',
  conformanceLevel: 'B-B',
});
```

More usage (forms, annotations, encryption, text extraction, PAdES B-T/B-LT/B-LTA) is demonstrated in [`example/src/App.tsx`](example/src/App.tsx).

---

## Example app

A runnable example app is included in [`example/`](./example) (Expo, exercises document creation, painting, saving, rendering, and text extraction end to end).

```sh
pnpm install
pnpm example start
```

Then press `a` for Android or `i` for iOS.

---

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

---

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
