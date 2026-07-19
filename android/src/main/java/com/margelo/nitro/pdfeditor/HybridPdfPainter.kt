package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfPage as PodofoPage
import com.podofo.android.PdfPainter as PodofoPainter

/** [lock] is the same one shared by the owning HybridPdfDocument — see its class doc for why. */
@DoNotStrip
class HybridPdfPainter(page: PodofoPage, private val lock: Any) : HybridPdfPainterSpec() {
  private val native = synchronized(lock) { PodofoPainter(page) }

  override fun setFont(font: HybridPdfFontSpec, fontSize: Double) {
    synchronized(lock) { native.setFont((font as HybridPdfFont).native, fontSize) }
  }

  override fun drawText(text: String, x: Double, y: Double) {
    synchronized(lock) { native.drawText(text, x, y) }
  }

  override fun drawImage(
    image: HybridPdfImageSpec,
    x: Double,
    y: Double,
    scaleX: Double?,
    scaleY: Double?,
  ) {
    synchronized(lock) {
      native.drawImage((image as HybridPdfImage).native, x, y, scaleX ?: 1.0, scaleY ?: 1.0)
    }
  }

  override fun drawLine(x1: Double, y1: Double, x2: Double, y2: Double) {
    synchronized(lock) { native.drawLine(x1, y1, x2, y2) }
  }

  override fun drawRectangle(x: Double, y: Double, width: Double, height: Double, fill: Boolean) {
    synchronized(lock) { native.drawRectangle(x, y, width, height, fill) }
  }

  override fun drawCircle(x: Double, y: Double, radius: Double, fill: Boolean) {
    synchronized(lock) { native.drawCircle(x, y, radius, fill) }
  }

  override fun setStrokingColorRGB(red: Double, green: Double, blue: Double) {
    synchronized(lock) { native.setStrokingColorRGB(red, green, blue) }
  }

  override fun setNonStrokingColorRGB(red: Double, green: Double, blue: Double) {
    synchronized(lock) { native.setNonStrokingColorRGB(red, green, blue) }
  }

  override fun save() {
    synchronized(lock) { native.save() }
  }

  override fun restore() {
    synchronized(lock) { native.restore() }
  }

  override fun finishDrawing() {
    synchronized(lock) { native.finishDrawing() }
  }

  override fun dispose() {
    synchronized(lock) {
      native.close()
    }
    super.dispose()
  }
}
