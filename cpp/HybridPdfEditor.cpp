#include "HybridPdfEditor.hpp"
#include "HybridPdfDocument.hpp"
#include <podofo/podofo.h>

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

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

} // namespace margelo::nitro::pdfeditor
