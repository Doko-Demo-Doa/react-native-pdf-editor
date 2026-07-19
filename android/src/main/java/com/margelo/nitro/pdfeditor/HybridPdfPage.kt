package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfPage as PodofoPage

@DoNotStrip
class HybridPdfPage(internal val native: PodofoPage) : HybridPdfPageSpec() {
  override val width: Double
    get() = native.width

  override val height: Double
    get() = native.height

  override val index: Double
    get() = native.index.toDouble()

  override fun createPainter(): HybridPdfPainterSpec {
    return HybridPdfPainter(native)
  }

  override fun getAnnotationCount(): Double {
    return native.annotationCount.toDouble()
  }

  override fun getAnnotationAt(index: Double): HybridPdfAnnotationSpec {
    return HybridPdfAnnotation(native.getAnnotationAt(index.toInt()))
  }

  override fun createAnnotation(
    annotationType: PdfAnnotationType,
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  ): HybridPdfAnnotationSpec {
    return HybridPdfAnnotation(
      native.createAnnotation(annotationType.toPodofoName(), x, y, width, height)
    )
  }

  override fun extractText(pattern: String?): Array<PdfTextEntry> {
    val entries = if (pattern != null) native.extractText(pattern) else native.extractText()
    return entries.map { PdfTextEntry(it.text, it.x, it.y, it.length) }.toTypedArray()
  }
}
