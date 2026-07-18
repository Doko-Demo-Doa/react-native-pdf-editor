package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import com.podofo.android.PdfDocument as PodofoDocument

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
}
