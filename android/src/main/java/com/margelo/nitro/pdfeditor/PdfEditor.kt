package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import com.podofo.android.PdfDocument as PodofoDocument
import com.podofo.android.PoDoFoWrapper as PodofoSigningWrapper

/**
 * The autolinked entry point HybridObject — a factory for PdfDocument
 * instances. Kept intentionally tiny: all real document logic lives in
 * HybridPdfDocument, which wraps the published podofo-android JNI wrapper's
 * com.podofo.android.PdfDocument (see PLAN.md §2 — there is no way to link
 * PoDoFo's C++ core directly from a separate Android native module today).
 */
@DoNotStrip
class PdfEditor : HybridPdfEditorSpec() {
  override fun createDocument(): HybridPdfDocumentSpec {
    return HybridPdfDocument(PodofoDocument.createNew())
  }

  override fun openDocument(path: String, password: String?): Promise<HybridPdfDocumentSpec> {
    return Promise.parallel<HybridPdfDocumentSpec> {
      HybridPdfDocument(PodofoDocument.load(path, password))
    }
  }

  override fun createSigningSession(options: PdfSigningSessionOptions): HybridPdfSigningSessionSpec {
    // com.podofo.android.PoDoFoWrapper's constructor has no root-certificate
    // parameter at all — its native init hardcodes std::nullopt for it
    // (confirmed in src/wrapper/podofo_jni.cpp). Rather than silently
    // dropping a caller-supplied root cert (an unnoticed trust-chain gap),
    // fail loudly until the Android wrapper gains this parameter upstream.
    if (options.rootCertificate != null) {
      throw UnsupportedOperationException(
        "rootCertificate is not supported on Android yet — the published podofo-android JNI wrapper's " +
          "PoDoFoWrapper has no root-certificate parameter (see PLAN.md open questions)."
      )
    }
    val wrapper = PodofoSigningWrapper(
      options.conformanceLevel.toPodofoName(),
      options.hashAlgorithm.toPodofoOid(),
      options.inputPath,
      options.outputPath,
      options.endCertificate,
      options.certificateChain
    )
    return HybridPdfSigningSession(wrapper)
  }
}
