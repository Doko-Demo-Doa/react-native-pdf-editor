#pragma once

#include <podofo/podofo.h>
#include <memory>
#include "HybridPdfAnnotationSpec.hpp"

namespace margelo::nitro::pdfeditor {

PoDoFo::PdfAnnotationType toPodofoAnnotationType(PdfAnnotationType type);
PdfAnnotationType toNitroAnnotationType(PoDoFo::PdfAnnotationType type);

/**
 * Wraps a raw PoDoFo::PdfAnnotation* owned by its page's annotation
 * collection. Holds the owning document alive (transitively via the page),
 * same lifetime contract as HybridPdfPage.
 */
class HybridPdfAnnotation : public HybridPdfAnnotationSpec {
 public:
  HybridPdfAnnotation(std::shared_ptr<PoDoFo::PdfMemDocument> doc,
                      PoDoFo::PdfAnnotation* annotation)
      : HybridObject(TAG), _doc(std::move(doc)), _annotation(annotation) {}

  PdfAnnotationType getAnnotationType() override;
  PdfRect getRect() override;
  void setRect(double x, double y, double width, double height) override;
  std::optional<std::string> getContents() override;
  void setContents(const std::optional<std::string>& contents) override;

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  PoDoFo::PdfAnnotation* _annotation;
};

}  // namespace margelo::nitro::pdfeditor
