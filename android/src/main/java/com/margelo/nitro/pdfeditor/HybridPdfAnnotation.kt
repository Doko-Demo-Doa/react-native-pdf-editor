package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfAnnotation as PodofoAnnotation

/** Matches PoDoFo's own PdfAnnotationType names, used by the Java wrapper's String-based API. */
internal fun PdfAnnotationType.toPodofoName(): String = when (this) {
  PdfAnnotationType.UNKNOWN -> "Unknown"
  PdfAnnotationType.TEXT -> "Text"
  PdfAnnotationType.LINK -> "Link"
  PdfAnnotationType.FREETEXT -> "FreeText"
  PdfAnnotationType.LINE -> "Line"
  PdfAnnotationType.SQUARE -> "Square"
  PdfAnnotationType.CIRCLE -> "Circle"
  PdfAnnotationType.POLYGON -> "Polygon"
  PdfAnnotationType.POLYLINE -> "PolyLine"
  PdfAnnotationType.HIGHLIGHT -> "Highlight"
  PdfAnnotationType.UNDERLINE -> "Underline"
  PdfAnnotationType.SQUIGGLY -> "Squiggly"
  PdfAnnotationType.STRIKEOUT -> "StrikeOut"
  PdfAnnotationType.STAMP -> "Stamp"
  PdfAnnotationType.CARET -> "Caret"
  PdfAnnotationType.INK -> "Ink"
  PdfAnnotationType.POPUP -> "Popup"
  PdfAnnotationType.FILEATTACHMENT -> "FileAttachement"
  PdfAnnotationType.SOUND -> "Sound"
  PdfAnnotationType.MOVIE -> "Movie"
  PdfAnnotationType.WIDGET -> "Widget"
  PdfAnnotationType.SCREEN -> "Screen"
  PdfAnnotationType.PRINTERMARK -> "PrinterMark"
  PdfAnnotationType.TRAPNET -> "TrapNet"
  PdfAnnotationType.WATERMARK -> "Watermark"
  PdfAnnotationType._3D -> "3D"
  PdfAnnotationType.RICHMEDIA -> "RichMedia"
  PdfAnnotationType.WEBMEDIA -> "WebMedia"
  PdfAnnotationType.REDACT -> "Redact"
  PdfAnnotationType.PROJECTION -> "Projection"
}

internal fun String.toNitroAnnotationType(): PdfAnnotationType =
  PdfAnnotationType.entries.firstOrNull { it.toPodofoName() == this } ?: PdfAnnotationType.UNKNOWN

@DoNotStrip
class HybridPdfAnnotation(private val native: PodofoAnnotation) : HybridPdfAnnotationSpec() {
  override val annotationType: PdfAnnotationType
    get() = native.annotationType.toNitroAnnotationType()

  override fun getRect(): PdfRect {
    val rect = native.rect
    return PdfRect(rect[0], rect[1], rect[2], rect[3])
  }

  override fun setRect(x: Double, y: Double, width: Double, height: Double) {
    native.setRect(x, y, width, height)
  }

  override fun getContents(): String? = native.contents
  override fun setContents(contents: String?) { native.contents = contents }
}
