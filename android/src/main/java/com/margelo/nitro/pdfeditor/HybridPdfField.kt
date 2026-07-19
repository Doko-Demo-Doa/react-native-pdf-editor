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

@DoNotStrip
class HybridPdfField(private val native: PodofoField) : HybridPdfFieldSpec() {
  override val fieldType: PdfFieldType
    get() = native.fieldType.toNitroFieldType()

  override val fullName: String
    get() = native.fullName

  override fun getText(): String? = native.text

  override fun setText(text: String?) {
    native.text = text
  }

  override fun isChecked(): Boolean = native.isChecked

  override fun setChecked(checked: Boolean) {
    native.isChecked = checked
  }
}
