#include "HybridPdfSigningSession.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

namespace {

// Inverse of PdfRemoteSignDocumentSession::UrlEncode (percent-decode).
std::string urlDecode(const std::string& value) {
  std::string result;
  result.reserve(value.size());
  for (size_t i = 0; i < value.size(); i++) {
    if (value[i] == '%' && i + 2 < value.size()) {
      int byte = std::stoi(value.substr(i + 1, 2), nullptr, 16);
      result.push_back(static_cast<char>(byte));
      i += 2;
    } else {
      result.push_back(value[i]);
    }
  }
  return result;
}

std::optional<ValidationData> toValidationData(
    const std::optional<std::vector<std::string>>& certificates,
    const std::optional<std::vector<std::string>>& crls,
    const std::optional<std::vector<std::string>>& ocsps) {
  if (!certificates.has_value() && !crls.has_value() && !ocsps.has_value()) {
    return std::nullopt;
  }
  ValidationData data;
  if (certificates.has_value())
    data.addCertificates(*certificates);
  if (crls.has_value())
    data.addCRLs(*crls);
  if (ocsps.has_value())
    data.addOCSPs(*ocsps);
  return data;
}

}  // namespace

std::shared_ptr<Promise<std::string>> HybridPdfSigningSession::beginSigning() {
  auto self = shared_from_this();
  return Promise<std::string>::async([this, self]() -> std::string {
    // beginSigning() is the one method in this API whose return value is
    // URL-encoded — see the header comment for why we decode it here.
    return urlDecode(_session->beginSigning());
  });
}

std::shared_ptr<Promise<void>> HybridPdfSigningSession::finishSigning(
    const std::string& signatureBase64,
    const std::optional<std::string>& timestampTokenBase64,
    const std::optional<std::vector<std::string>>& certificates,
    const std::optional<std::vector<std::string>>& crls,
    const std::optional<std::vector<std::string>>& ocsps) {
  auto self = shared_from_this();
  auto validationData = toValidationData(certificates, crls, ocsps);
  return Promise<void>::async(
      [this, self, signatureBase64, timestampTokenBase64, validationData]() {
        _session->finishSigning(signatureBase64,
                                timestampTokenBase64.value_or(std::string()),
                                validationData);
      });
}

std::shared_ptr<Promise<std::string>>
HybridPdfSigningSession::beginSigningLTA() {
  auto self = shared_from_this();
  return Promise<std::string>::async([this, self]() -> std::string {
    // Unlike beginSigning(), this one is already plain base64 — no decoding
    // needed.
    return _session->beginSigningLTA();
  });
}

std::shared_ptr<Promise<void>> HybridPdfSigningSession::finishSigningLTA(
    const std::string& timestampTokenBase64,
    const std::optional<std::vector<std::string>>& certificates,
    const std::optional<std::vector<std::string>>& crls,
    const std::optional<std::vector<std::string>>& ocsps) {
  auto self = shared_from_this();
  auto validationData = toValidationData(certificates, crls, ocsps);
  return Promise<void>::async(
      [this, self, timestampTokenBase64, validationData]() {
        _session->finishSigningLTA(timestampTokenBase64, validationData);
      });
}

std::string HybridPdfSigningSession::getCrlFromCertificate(
    const std::string& certificateBase64) {
  return _session->getCrlFromCertificate(certificateBase64);
}

std::string HybridPdfSigningSession::extractSignerCertFromTSR(
    const std::string& tsrBase64) {
  return _session->extractSignerCertFromTSR(tsrBase64);
}

std::string HybridPdfSigningSession::extractIssuerCertFromTSR(
    const std::string& tsrBase64) {
  return _session->extractIssuerCertFromTSR(tsrBase64);
}

std::string HybridPdfSigningSession::getOCSPResponderUrl(
    const std::string& certificateBase64,
    const std::string& issuerCertificateBase64) {
  return _session->getOCSPFromCertificate(certificateBase64,
                                          issuerCertificateBase64);
}

std::string HybridPdfSigningSession::buildOCSPRequest(
    const std::string& certificateBase64,
    const std::string& issuerCertificateBase64) {
  return _session->buildOCSPRequestFromCertificates(certificateBase64,
                                                    issuerCertificateBase64);
}

std::string HybridPdfSigningSession::getCertificateIssuerUrl(
    const std::string& certificateBase64) {
  return _session->getCertificateIssuerUrlFromCertificate(certificateBase64);
}

}  // namespace margelo::nitro::pdfeditor
