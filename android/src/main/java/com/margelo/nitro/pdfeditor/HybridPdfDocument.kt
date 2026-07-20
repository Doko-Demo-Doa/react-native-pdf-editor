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

/**
 * Runs [block] holding both [lockA] and [lockB], always acquired in the same global order (by
 * identity hash) regardless of which document called which
 * - avoids deadlock if two documents are merged into each other concurrently from different
 *   threads. Mirrors the iOS C++ side's `std::scoped_lock` in `HybridPdfDocument::appendPagesFrom`
 *   and friends.
 */
private fun <T> synchronizedBoth(lockA: Any, lockB: Any, block: () -> T): T {
  val (first, second) =
    if (System.identityHashCode(lockA) <= System.identityHashCode(lockB)) {
      lockA to lockB
    } else {
      lockB to lockA
    }
  return synchronized(first) { synchronized(second) { block() } }
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
 *
 * [lock] guards every native call into this document's underlying object graph — the podofo-android
 * wrapper classes (PdfDocument/PdfPage/PdfPainter/PdfField/PdfAnnotation) have no internal
 * synchronization of their own (confirmed by reading their source: no `synchronized` anywhere), and
 * `save()` runs on a background thread via `Promise.parallel` while the document remains fully
 * callable from JS. Shared (not copied) with every HybridPdfPage/HybridPdfPainter/
 * HybridPdfField/HybridPdfAnnotation obtained from this document — mirrors the iOS C++ side's
 * `std::mutex` fix in HybridPdfDocument.hpp/cpp.
 */
@DoNotStrip
class HybridPdfDocument(private val native: PodofoDocument) : HybridPdfDocumentSpec() {
  private val lock = Any()

  override val pageCount: Double
    get() = synchronized(lock) { native.pageCount.toDouble() }

  override fun getPage(index: Double): HybridPdfPageSpec {
    return synchronized(lock) { HybridPdfPage(native.getPage(index.toInt()), lock) }
  }

  override fun createPage(width: Double, height: Double): HybridPdfPageSpec {
    return synchronized(lock) { HybridPdfPage(native.createPage(width, height), lock) }
  }

  override fun createPageAt(index: Double, width: Double, height: Double): HybridPdfPageSpec {
    return synchronized(lock) {
      HybridPdfPage(native.createPageAt(index.toInt(), width, height), lock)
    }
  }

  override fun removePageAt(index: Double) {
    synchronized(lock) { native.removePageAt(index.toInt()) }
  }

  override fun appendPagesFrom(source: HybridPdfDocumentSpec) {
    val src = source as HybridPdfDocument
    require(src !== this) { "Cannot merge a document into itself" }
    synchronizedBoth(lock, src.lock) { native.appendPagesFrom(src.native) }
  }

  override fun appendPageRangeFrom(
    source: HybridPdfDocumentSpec,
    pageIndex: Double,
    pageCount: Double,
  ) {
    val src = source as HybridPdfDocument
    require(src !== this) { "Cannot merge a document into itself" }
    synchronizedBoth(lock, src.lock) {
      native.appendPagesFrom(src.native, pageIndex.toInt(), pageCount.toInt())
    }
  }

  override fun insertPageFrom(atIndex: Double, source: HybridPdfDocumentSpec, pageIndex: Double) {
    val src = source as HybridPdfDocument
    require(src !== this) { "Cannot merge a document into itself" }
    synchronizedBoth(lock, src.lock) {
      native.insertPageFrom(atIndex.toInt(), src.native, pageIndex.toInt())
    }
  }

  override fun getStandard14Font(name: Standard14FontName): HybridPdfFontSpec {
    return synchronized(lock) { HybridPdfFont(native.getStandard14Font(name.toPodofoName())) }
  }

  override fun loadFont(path: String): HybridPdfFontSpec {
    return synchronized(lock) { HybridPdfFont(native.getOrCreateFont(path)) }
  }

  override fun loadFontFromBuffer(data: ArrayBuffer): HybridPdfFontSpec {
    return synchronized(lock) {
      HybridPdfFont(native.getOrCreateFontFromBuffer(data.toByteArray()))
    }
  }

  override fun createImageFromBuffer(data: ArrayBuffer): HybridPdfImageSpec {
    return synchronized(lock) { HybridPdfImage(native.createImageFromBuffer(data.toByteArray())) }
  }

  override fun save(path: String): Promise<Unit> {
    return Promise.parallel<Unit> { synchronized(lock) { native.save(path) } }
  }

  override fun getTitle(): String? = synchronized(lock) { native.title }

  override fun setTitle(title: String?) {
    synchronized(lock) { native.title = title }
  }

  override fun getAuthor(): String? = synchronized(lock) { native.author }

  override fun setAuthor(author: String?) {
    synchronized(lock) { native.author = author }
  }

  override fun getSubject(): String? = synchronized(lock) { native.subject }

  override fun setSubject(subject: String?) {
    synchronized(lock) { native.subject = subject }
  }

  override fun getCreator(): String? = synchronized(lock) { native.creator }

  override fun setCreator(creator: String?) {
    synchronized(lock) { native.creator = creator }
  }

  override val fieldCount: Double
    get() = synchronized(lock) { native.fieldCount.toDouble() }

  override fun getFieldAt(index: Double): HybridPdfFieldSpec {
    return synchronized(lock) { HybridPdfField(native.getFieldAt(index.toInt()), lock) }
  }

  override fun createTextBox(name: String): HybridPdfFieldSpec {
    return synchronized(lock) { HybridPdfField(native.createTextBox(name), lock) }
  }

  override fun createCheckBox(name: String): HybridPdfFieldSpec {
    return synchronized(lock) { HybridPdfField(native.createCheckBox(name), lock) }
  }

  override fun setEncrypted(
    userPassword: String,
    ownerPassword: String,
    permissions: PdfPermissions?,
  ) {
    synchronized(lock) {
      native.setEncrypted(userPassword, ownerPassword, permissions.toPodofoBitmask())
    }
  }

  override fun isEncrypted(): Boolean = synchronized(lock) { native.isEncrypted }

  override fun dispose() {
    synchronized(lock) {
      native.close()
    }
    super.dispose()
  }
}
