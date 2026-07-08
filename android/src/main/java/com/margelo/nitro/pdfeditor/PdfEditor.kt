package com.margelo.nitro.pdfeditor
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class PdfEditor : HybridPdfEditorSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
