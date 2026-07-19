package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfPage as PodofoPage
import com.podofo.android.PdfPainter as PodofoPainter

@DoNotStrip
class HybridPdfPainter(page: PodofoPage) : HybridPdfPainterSpec() {
  private val native = PodofoPainter(page)

  override fun setFont(font: HybridPdfFontSpec, fontSize: Double) {
    native.setFont((font as HybridPdfFont).native, fontSize)
  }

  override fun drawText(text: String, x: Double, y: Double) {
    native.drawText(text, x, y)
  }

  override fun drawImage(image: HybridPdfImageSpec, x: Double, y: Double, scaleX: Double?, scaleY: Double?) {
    native.drawImage((image as HybridPdfImage).native, x, y, scaleX ?: 1.0, scaleY ?: 1.0)
  }

  override fun drawLine(x1: Double, y1: Double, x2: Double, y2: Double) {
    native.drawLine(x1, y1, x2, y2)
  }

  override fun drawRectangle(x: Double, y: Double, width: Double, height: Double, fill: Boolean) {
    native.drawRectangle(x, y, width, height, fill)
  }

  override fun drawCircle(x: Double, y: Double, radius: Double, fill: Boolean) {
    native.drawCircle(x, y, radius, fill)
  }

  override fun setStrokingColorRGB(red: Double, green: Double, blue: Double) {
    native.setStrokingColorRGB(red, green, blue)
  }

  override fun setNonStrokingColorRGB(red: Double, green: Double, blue: Double) {
    native.setNonStrokingColorRGB(red, green, blue)
  }

  override fun save() {
    native.save()
  }

  override fun restore() {
    native.restore()
  }

  override fun finishDrawing() {
    native.finishDrawing()
  }

  override fun dispose() {
    native.close()
    super.dispose()
  }
}
