#pragma once

#include "HybridPdfSigningSessionSpec.hpp"
#include <podofo/podofo.h>
#include <memory>

namespace margelo::nitro::pdfeditor {

/**
 * Direct C++ binding onto PoDoFo::PdfRemoteSignDocumentSession — a
 * purpose-built two-phase remote/external ("hash-then-sign") signing
 * session, confirmed by reading its .cpp to already exist in the fork
 * rather than something we need to assemble from lower-level primitives.
 *
 * One quirk normalized away here rather than leaked to JS: the underlying
 * `beginSigning()` returns its hash URL-encoded (confirmed by reading
 * PdfRemoteSignDocumentSession::UrlEncode/beginSigning) while every other
 * base64 in/out of this API (including, confusingly, `beginSigningLTA()`'s
 * own return value) is plain base64. This binding URL-decodes only that
 * one value so JS always sees plain base64 everywhere.
 */
class HybridPdfSigningSession : public HybridPdfSigningSessionSpec {
public:
  explicit HybridPdfSigningSession(std::unique_ptr<PoDoFo::PdfRemoteSignDocumentSession> session)
      : HybridObject(TAG), _session(std::move(session)) {}

  std::shared_ptr<Promise<std::string>> beginSigning() override;
  std::shared_ptr<Promise<void>> finishSigning(const std::string& signatureBase64,
                                                const std::optional<std::string>& timestampTokenBase64,
                                                const std::optional<std::vector<std::string>>& certificates,
                                                const std::optional<std::vector<std::string>>& crls,
                                                const std::optional<std::vector<std::string>>& ocsps) override;
  std::shared_ptr<Promise<std::string>> beginSigningLTA() override;
  std::shared_ptr<Promise<void>> finishSigningLTA(const std::string& timestampTokenBase64,
                                                   const std::optional<std::vector<std::string>>& certificates,
                                                   const std::optional<std::vector<std::string>>& crls,
                                                   const std::optional<std::vector<std::string>>& ocsps) override;

  std::string getCrlFromCertificate(const std::string& certificateBase64) override;
  std::string extractSignerCertFromTSR(const std::string& tsrBase64) override;
  std::string extractIssuerCertFromTSR(const std::string& tsrBase64) override;
  std::string getOCSPResponderUrl(const std::string& certificateBase64, const std::string& issuerCertificateBase64) override;
  std::string buildOCSPRequest(const std::string& certificateBase64, const std::string& issuerCertificateBase64) override;
  std::string getCertificateIssuerUrl(const std::string& certificateBase64) override;

private:
  // Not a shared_ptr like HybridPdfDocument's PdfMemDocument: nothing else
  // in this library ever needs to reach into a signing session, so there's
  // no cross-object lifetime to manage — this object owns it outright.
  std::unique_ptr<PoDoFo::PdfRemoteSignDocumentSession> _session;
};

} // namespace margelo::nitro::pdfeditor
