#pragma once

#include <podofo/podofo.h>
#include <memory>
#include <mutex>
#include "HybridPdfFieldSpec.hpp"

namespace margelo::nitro::pdfeditor {

PdfFieldType toNitroFieldType(PoDoFo::PdfFieldType type);

/**
 * Wraps a raw PoDoFo::PdfField* owned by its document's AcroForm. Holds the
 * owning document alive, same lifetime contract as HybridPdfPage. `_mutex`
 * is the same one shared by the owning HybridPdfDocument — see
 * HybridPdfDocument.hpp for why.
 */
class HybridPdfField : public HybridPdfFieldSpec {
 public:
  HybridPdfField(std::shared_ptr<PoDoFo::PdfMemDocument> doc,
                 std::shared_ptr<std::mutex> mutex, PoDoFo::PdfField* field)
      : HybridObject(TAG),
        _doc(std::move(doc)),
        _mutex(std::move(mutex)),
        _field(field) {}

  PdfFieldType getFieldType() override;
  std::string getFullName() override;
  std::optional<std::string> getText() override;
  void setText(const std::optional<std::string>& text) override;
  bool isChecked() override;
  void setChecked(bool checked) override;
  PdfSignatureInfo getSignatureInfo() override;
  std::shared_ptr<Promise<PdfSignatureVerificationStatus>> verifySignature(
      const std::string& documentPath) override;

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  std::shared_ptr<std::mutex> _mutex;
  PoDoFo::PdfField* _field;
};

}  // namespace margelo::nitro::pdfeditor
