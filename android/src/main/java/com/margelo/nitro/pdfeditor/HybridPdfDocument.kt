package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import com.podofo.android.PdfDocument as PodofoDocument
import com.podofo.android.PdfPermission as PodofoPermission

private fun PdfPermissions?.toPodofoBitmask(): Int {
  if (this == null) return PodofoPermission.DEFAULT
  var result = 0
  if (print != false) result = result or PodofoPermission.PRINT
  if (edit != false) result = result or PodofoPermission.EDIT
  if (copy != false) result = result or PodofoPermission.COPY
  if (editNotes != false) result = result or PodofoPermission.EDIT_NOTES
  if (fillAndSign != false) result = result or PodofoPermission.FILL_AND_SIGN
  if (accessible != false) result = result or PodofoPermission.ACCESSIBLE
  if (docAssembly != false) result = result or PodofoPermission.DOC_ASSEMBLY
  if (highPrint != false) result = result or PodofoPermission.HIGH_PRINT
  return result
}

private fun Standard14FontName.toPodofoName(): String =
  when (this) {
    Standard14FontName.TIMESROMAN -> "TimesRoman"
    Standard14FontName.TIMESITALIC -> "TimesItalic"
    Standard14FontName.TIMESBOLD -> "TimesBold"
    Standard14FontName.TIMESBOLDITALIC -> "TimesBoldItalic"
    Standard14FontName.HELVETICA -> "Helvetica"
    Standard14FontName.HELVETICAOBLIQUE -> "HelveticaOblique"
    Standard14FontName.HELVETICABOLD -> "HelveticaBold"
    Standard14FontName.HELVETICABOLDOBLIQUE -> "HelveticaBoldOblique"
    Standard14FontName.COURIER -> "Courier"
    Standard14FontName.COURIEROBLIQUE -> "CourierOblique"
    Standard14FontName.COURIERBOLD -> "CourierBold"
    Standard14FontName.COURIERBOLDOBLIQUE -> "CourierBoldOblique"
    Standard14FontName.SYMBOL -> "Symbol"
    Standard14FontName.ZAPFDINGBATS -> "ZapfDingbats"
  }

/**
 * Wraps the podofo-android JNI wrapper's com.podofo.android.PdfDocument. See PLAN.md §2: unlike iOS
 * (which binds Nitro's C++ layer directly to PoDoFo's core), the published podofo-android AAR only
 * exposes this compiled Java wrapper — no headers/static libs for direct linkage.
 */
@DoNotStrip
class HybridPdfDocument(private val native: PodofoDocument) : HybridPdfDocumentSpec() {
  override val pageCount: Double
    get() = native.pageCount.toDouble()

  override fun getPage(index: Double): HybridPdfPageSpec {
    return HybridPdfPage(native.getPage(index.toInt()))
  }

  override fun createPage(width: Double, height: Double): HybridPdfPageSpec {
    return HybridPdfPage(native.createPage(width, height))
  }

  override fun removePageAt(index: Double) {
    native.removePageAt(index.toInt())
  }

  override fun getStandard14Font(name: Standard14FontName): HybridPdfFontSpec {
    return HybridPdfFont(native.getStandard14Font(name.toPodofoName()))
  }

  override fun loadFont(path: String): HybridPdfFontSpec {
    return HybridPdfFont(native.getOrCreateFont(path))
  }

  override fun createImageFromBuffer(data: ArrayBuffer): HybridPdfImageSpec {
    return HybridPdfImage(native.createImageFromBuffer(data.toByteArray()))
  }

  override fun save(path: String): Promise<Unit> {
    return Promise.parallel<Unit> { native.save(path) }
  }

  override fun getTitle(): String? = native.title

  override fun setTitle(title: String?) {
    native.title = title
  }

  override fun getAuthor(): String? = native.author

  override fun setAuthor(author: String?) {
    native.author = author
  }

  override fun getSubject(): String? = native.subject

  override fun setSubject(subject: String?) {
    native.subject = subject
  }

  override fun getCreator(): String? = native.creator

  override fun setCreator(creator: String?) {
    native.creator = creator
  }

  override val fieldCount: Double
    get() = native.fieldCount.toDouble()

  override fun getFieldAt(index: Double): HybridPdfFieldSpec {
    return HybridPdfField(native.getFieldAt(index.toInt()))
  }

  override fun createTextBox(name: String): HybridPdfFieldSpec {
    return HybridPdfField(native.createTextBox(name))
  }

  override fun createCheckBox(name: String): HybridPdfFieldSpec {
    return HybridPdfField(native.createCheckBox(name))
  }

  override fun setEncrypted(
    userPassword: String,
    ownerPassword: String,
    permissions: PdfPermissions?,
  ) {
    native.setEncrypted(userPassword, ownerPassword, permissions.toPodofoBitmask())
  }

  override fun isEncrypted(): Boolean = native.isEncrypted

  override fun dispose() {
    native.close()
    super.dispose()
  }
}
