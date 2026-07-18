#include "HybridPdfEditor.hpp"
#include "HybridPdfDocument.hpp"
#include "HybridPdfSigningSession.hpp"
#include <podofo/podofo.h>

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

static std::string toPodofoConformanceLevel(PadesConformanceLevel level) {
  switch (level) {
    case PadesConformanceLevel::B_B: return "ADES_B_B";
    case PadesConformanceLevel::B_T: return "ADES_B_T";
    case PadesConformanceLevel::B_LT: return "ADES_B_LT";
    case PadesConformanceLevel::B_LTA: return "ADES_B_LTA";
  }
  throw std::invalid_argument("Unknown PadesConformanceLevel");
}

// PdfRemoteSignDocumentSession takes a digest OID, not an algorithm name —
// confirmed against its hashAlgorithmFromOid() implementation.
static std::string toPodofoHashAlgorithmOid(DigestAlgorithm algorithm) {
  switch (algorithm) {
    case DigestAlgorithm::SHA256: return "2.16.840.1.101.3.4.2.1";
    case DigestAlgorithm::SHA384: return "2.16.840.1.101.3.4.2.2";
    case DigestAlgorithm::SHA512: return "2.16.840.1.101.3.4.2.3";
  }
  throw std::invalid_argument("Unknown DigestAlgorithm");
}

std::shared_ptr<HybridPdfDocumentSpec> HybridPdfEditor::createDocument() {
  auto doc = std::make_shared<PdfMemDocument>();
  return std::make_shared<HybridPdfDocument>(std::move(doc));
}

std::shared_ptr<Promise<std::shared_ptr<HybridPdfDocumentSpec>>> HybridPdfEditor::openDocument(
    const std::string& path, const std::optional<std::string>& password) {
  return Promise<std::shared_ptr<HybridPdfDocumentSpec>>::async(
      [path, password]() -> std::shared_ptr<HybridPdfDocumentSpec> {
        auto doc = std::make_shared<PdfMemDocument>();
        doc->Load(path, password.value_or(std::string()));
        return std::make_shared<HybridPdfDocument>(std::move(doc));
      });
}

std::shared_ptr<HybridPdfSigningSessionSpec> HybridPdfEditor::createSigningSession(const PdfSigningSessionOptions& options) {
  auto session = std::make_unique<PdfRemoteSignDocumentSession>(
      toPodofoConformanceLevel(options.conformanceLevel), toPodofoHashAlgorithmOid(options.hashAlgorithm),
      options.inputPath, options.outputPath, options.endCertificate, options.certificateChain, options.rootCertificate,
      std::nullopt);
  return std::make_shared<HybridPdfSigningSession>(std::move(session));
}

} // namespace margelo::nitro::pdfeditor
