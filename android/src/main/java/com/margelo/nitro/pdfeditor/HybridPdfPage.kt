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

  override fun getRotation(): Double {
    return synchronized(lock) { native.rotation.toDouble() }
  }

  override fun setRotation(rotation: Double) {
    synchronized(lock) { native.rotation = rotation.toInt() }
  }

  override fun getMediaBox(): PdfRect {
    return synchronized(lock) {
      val box = native.mediaBox
      PdfRect(box[0], box[1], box[2], box[3])
    }
  }

  override fun setMediaBox(x: Double, y: Double, width: Double, height: Double) {
    synchronized(lock) { native.setMediaBox(x, y, width, height) }
  }

  override fun getCropBox(): PdfRect {
    return synchronized(lock) {
      val box = native.cropBox
      PdfRect(box[0], box[1], box[2], box[3])
    }
  }

  override fun setCropBox(x: Double, y: Double, width: Double, height: Double) {
    synchronized(lock) { native.setCropBox(x, y, width, height) }
  }

  override fun moveTo(newIndex: Double): Boolean {
    return synchronized(lock) { native.moveTo(newIndex.toInt()) }
  }

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
