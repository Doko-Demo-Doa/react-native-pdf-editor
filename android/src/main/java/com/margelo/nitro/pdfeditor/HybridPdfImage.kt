package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfImage as PodofoImage

@DoNotStrip
class HybridPdfImage(internal val native: PodofoImage) : HybridPdfImageSpec() {
  override val width: Double
    get() = native.width.toDouble()

  override val height: Double
    get() = native.height.toDouble()

  override fun dispose() {
    native.close()
    super.dispose()
  }
}
