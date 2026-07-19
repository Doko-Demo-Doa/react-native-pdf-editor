package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.Promise
import com.podofo.android.PoDoFoWrapper as PodofoSigningWrapper

internal fun PadesConformanceLevel.toPodofoName(): String =
  when (this) {
    PadesConformanceLevel.B_B -> "ADES_B_B"
    PadesConformanceLevel.B_T -> "ADES_B_T"
    PadesConformanceLevel.B_LT -> "ADES_B_LT"
    PadesConformanceLevel.B_LTA -> "ADES_B_LTA"
  }

// PoDoFoWrapper (and the PdfRemoteSignDocumentSession it wraps) takes a
// digest OID, not an algorithm name — confirmed against the fork's own
// hashAlgorithmFromOid() implementation. Same OIDs used on iOS.
internal fun DigestAlgorithm.toPodofoOid(): String =
  when (this) {
    DigestAlgorithm.SHA256 -> "2.16.840.1.101.3.4.2.1"
    DigestAlgorithm.SHA384 -> "2.16.840.1.101.3.4.2.2"
    DigestAlgorithm.SHA512 -> "2.16.840.1.101.3.4.2.3"
  }

// Inverse of PdfRemoteSignDocumentSession::UrlEncode (percent-decode). Not
// java.net.URLDecoder: that follows application/x-www-form-urlencoded
// (decodes '+' to space), but PoDoFo's own encoder is plain RFC 3986
// percent-encoding with no such special case — this must match it exactly.
private fun urlDecode(value: String): String {
  val bytes = ByteArray(value.length)
  var out = 0
  var i = 0
  while (i < value.length) {
    if (value[i] == '%' && i + 2 < value.length) {
      bytes[out++] = value.substring(i + 1, i + 3).toInt(16).toByte()
      i += 3
    } else {
      bytes[out++] = value[i].code.toByte()
      i++
    }
  }
  return String(bytes, 0, out, Charsets.ISO_8859_1)
}

@DoNotStrip
class HybridPdfSigningSession(private val native: PodofoSigningWrapper) :
  HybridPdfSigningSessionSpec() {
  override fun beginSigning(): Promise<String> {
    // beginSigning() is the one method in this API whose return value is
    // URL-encoded — see urlDecode()'s comment for why.
    return Promise.parallel<String> { urlDecode(native.calculateHash()) }
  }

  override fun finishSigning(
    signatureBase64: String,
    timestampTokenBase64: String?,
    certificates: Array<String>?,
    crls: Array<String>?,
    ocsps: Array<String>?,
  ): Promise<Unit> {
    return Promise.parallel<Unit> {
      native.finalizeSigningWithSignedHash(
        signatureBase64,
        timestampTokenBase64 ?: "",
        certificates?.toList(),
        crls?.toList(),
        ocsps?.toList(),
      )
    }
  }

  override fun beginSigningLTA(): Promise<String> {
    // Unlike beginSigning(), this one is already plain base64 — no decoding needed.
    return Promise.parallel<String> { native.beginSigningLTA() }
  }

  override fun finishSigningLTA(
    timestampTokenBase64: String,
    certificates: Array<String>?,
    crls: Array<String>?,
    ocsps: Array<String>?,
  ): Promise<Unit> {
    return Promise.parallel<Unit> {
      native.finishSigningLTA(
        timestampTokenBase64,
        certificates?.toList(),
        crls?.toList(),
        ocsps?.toList(),
      )
    }
  }

  override fun getCrlFromCertificate(certificateBase64: String): String {
    return native.getCrlFromCertificate(certificateBase64)
  }

  override fun extractSignerCertFromTSR(tsrBase64: String): String {
    return native.extractSignerCertFromTSR(tsrBase64)
  }

  override fun extractIssuerCertFromTSR(tsrBase64: String): String {
    return native.extractIssuerCertFromTSR(tsrBase64)
  }

  override fun getOCSPResponderUrl(
    certificateBase64: String,
    issuerCertificateBase64: String,
  ): String {
    return native.getOCSPFromCertificate(certificateBase64, issuerCertificateBase64)
  }

  override fun buildOCSPRequest(
    certificateBase64: String,
    issuerCertificateBase64: String,
  ): String {
    return native.buildOCSPRequestFromCertificates(certificateBase64, issuerCertificateBase64)
  }

  override fun getCertificateIssuerUrl(certificateBase64: String): String {
    return native.getCertificateIssuerUrlFromCertificate(certificateBase64)
  }

  override fun dispose() {
    native.close()
    super.dispose()
  }
}
