#pragma once

#include "HybridPdfEditorSpec.hpp"

namespace margelo::nitro::pdfeditor {

/**
 * The autolinked entry point HybridObject — a factory for PdfDocument
 * instances. Kept intentionally tiny: all real document logic lives in
 * HybridPdfDocument.
 */
class HybridPdfEditor : public HybridPdfEditorSpec {
 public:
  HybridPdfEditor() : HybridObject(TAG) {}

  std::shared_ptr<HybridPdfDocumentSpec> createDocument() override;
  std::shared_ptr<Promise<std::shared_ptr<HybridPdfDocumentSpec>>> openDocument(
      const std::string& path,
      const std::optional<std::string>& password) override;
  std::shared_ptr<Promise<bool>> isEncrypted(const std::string& path) override;
  std::shared_ptr<HybridPdfSigningSessionSpec> createSigningSession(
      const PdfSigningSessionOptions& options) override;
  std::shared_ptr<Promise<PdfPageBitmap>> renderPageToBitmap(
      const RenderPageOptions& options) override;
  std::shared_ptr<Promise<void>> writeBitmapToImage(
      const PdfPageBitmap& bitmap, const std::string& outputPath,
      const std::string& format) override;
};

}  // namespace margelo::nitro::pdfeditor
