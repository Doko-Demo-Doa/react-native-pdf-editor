package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import com.podofo.android.PdfField as PodofoField
import com.podofo.android.PdfSignature as PodofoSignature

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

private fun PodofoSignature.VerifyStatus.toNitroStatus(): PdfSignatureVerificationStatus =
  when (this) {
    PodofoSignature.VerifyStatus.COULD_NOT_VERIFY -> PdfSignatureVerificationStatus.COULDNOTVERIFY
    PodofoSignature.VerifyStatus.INVALID -> PdfSignatureVerificationStatus.INVALID
    PodofoSignature.VerifyStatus.VALID_NO_TRUST -> PdfSignatureVerificationStatus.VALIDNOTRUST
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

  override fun getSignatureInfo(): PdfSignatureInfo =
    synchronized(lock) {
      val signature = native.asSignature()
      PdfSignatureInfo(
        hasSignatureValue = signature.hasSignatureValue(),
        filter = signature.filter,
        subFilter = signature.subFilter,
        type = signature.type,
        signerName = signature.name,
        reason = signature.reason,
        location = signature.location,
        contactInfo = signature.contactInfo,
        signingDate = signature.signDate,
        byteRange = signature.byteRange?.map { it.toDouble() }?.toDoubleArray(),
      )
    }

  override fun verifySignature(documentPath: String): Promise<PdfSignatureVerificationStatus> {
    return Promise.parallel<PdfSignatureVerificationStatus> {
      synchronized(lock) {
        native.asSignature().verifySignature(documentPath).toNitroStatus()
      }
    }
  }
}
