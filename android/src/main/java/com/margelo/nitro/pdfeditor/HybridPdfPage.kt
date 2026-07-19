package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfPage as PodofoPage

/** [lock] is the same one shared by the owning HybridPdfDocument — see its class doc for why. */
@DoNotStrip
class HybridPdfPage(internal val native: PodofoPage, private val lock: Any) : HybridPdfPageSpec() {
  override val width: Double
    get() = synchronized(lock) { native.width }

  override val height: Double
    get() = synchronized(lock) { native.height }

  override val index: Double
    get() = synchronized(lock) { native.index.toDouble() }

  override fun createPainter(): HybridPdfPainterSpec {
    return synchronized(lock) { HybridPdfPainter(native, lock) }
  }

  override fun getAnnotationCount(): Double {
    return synchronized(lock) { native.annotationCount.toDouble() }
  }

  override fun getAnnotationAt(index: Double): HybridPdfAnnotationSpec {
    return synchronized(lock) { HybridPdfAnnotation(native.getAnnotationAt(index.toInt()), lock) }
  }

  override fun createAnnotation(
    annotationType: PdfAnnotationType,
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  ): HybridPdfAnnotationSpec {
    return synchronized(lock) {
      HybridPdfAnnotation(
        native.createAnnotation(annotationType.toPodofoName(), x, y, width, height),
        lock,
      )
    }
  }

  override fun extractText(pattern: String?): Array<PdfTextEntry> {
    return synchronized(lock) {
      val entries = if (pattern != null) native.extractText(pattern) else native.extractText()
      entries.map { PdfTextEntry(it.text, it.x, it.y, it.length) }.toTypedArray()
    }
  }
}
