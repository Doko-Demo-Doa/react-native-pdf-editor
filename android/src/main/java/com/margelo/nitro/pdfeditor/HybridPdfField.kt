package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfField as PodofoField

private fun String.toNitroFieldType(): PdfFieldType =
  when (this) {
    "Unknown" -> PdfFieldType.UNKNOWN
    "PushButton" -> PdfFieldType.PUSHBUTTON
    "CheckBox" -> PdfFieldType.CHECKBOX
    "RadioButton" -> PdfFieldType.RADIOBUTTON
    "TextBox" -> PdfFieldType.TEXTBOX
    "ComboBox" -> PdfFieldType.COMBOBOX
    "ListBox" -> PdfFieldType.LISTBOX
    "Signature" -> PdfFieldType.SIGNATURE
    else -> PdfFieldType.UNKNOWN
  }

/** [lock] is the same one shared by the owning HybridPdfDocument — see its class doc for why. */
@DoNotStrip
class HybridPdfField(private val native: PodofoField, private val lock: Any) :
  HybridPdfFieldSpec() {
  override val fieldType: PdfFieldType
    get() = synchronized(lock) { native.fieldType.toNitroFieldType() }

  override val fullName: String
    get() = synchronized(lock) { native.fullName }

  override fun getText(): String? = synchronized(lock) { native.text }

  override fun setText(text: String?) {
    synchronized(lock) { native.text = text }
  }

  override fun isChecked(): Boolean = synchronized(lock) { native.isChecked }

  override fun setChecked(checked: Boolean) {
    synchronized(lock) { native.isChecked = checked }
  }
}
