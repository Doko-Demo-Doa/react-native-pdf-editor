#pragma once

#include <podofo/podofo.h>
#include <memory>
#include "HybridPdfFieldSpec.hpp"

namespace margelo::nitro::pdfeditor {

PdfFieldType toNitroFieldType(PoDoFo::PdfFieldType type);

/**
 * Wraps a raw PoDoFo::PdfField* owned by its document's AcroForm. Holds the
 * owning document alive, same lifetime contract as HybridPdfPage.
 */
class HybridPdfField : public HybridPdfFieldSpec {
 public:
  HybridPdfField(std::shared_ptr<PoDoFo::PdfMemDocument> doc,
                 PoDoFo::PdfField* field)
      : HybridObject(TAG), _doc(std::move(doc)), _field(field) {}

  PdfFieldType getFieldType() override;
  std::string getFullName() override;
  std::optional<std::string> getText() override;
  void setText(const std::optional<std::string>& text) override;
  bool isChecked() override;
  void setChecked(bool checked) override;

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  PoDoFo::PdfField* _field;
};

}  // namespace margelo::nitro::pdfeditor
