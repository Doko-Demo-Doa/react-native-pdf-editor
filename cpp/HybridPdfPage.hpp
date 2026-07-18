#pragma once

#include "HybridPdfPageSpec.hpp"
#include <podofo/podofo.h>
#include <memory>

namespace margelo::nitro::pdfeditor {

/**
 * Wraps a raw PoDoFo::PdfPage* owned by its document's page tree. Holds a
 * shared_ptr to the owning PdfMemDocument (not just the HybridPdfDocument
 * wrapper) so the underlying page memory stays alive for as long as any JS
 * reference to this page exists, even if the JS PdfDocument object itself
 * has already been garbage collected.
 */
class HybridPdfPage : public HybridPdfPageSpec {
public:
  HybridPdfPage(std::shared_ptr<PoDoFo::PdfMemDocument> doc, PoDoFo::PdfPage* page)
      : HybridObject(TAG), _doc(std::move(doc)), _page(page) {}

  double getWidth() override;
  double getHeight() override;
  double getIndex() override;

  std::shared_ptr<HybridPdfPainterSpec> createPainter() override;
  double getAnnotationCount() override;
  std::shared_ptr<HybridPdfAnnotationSpec> getAnnotationAt(double index) override;
  std::shared_ptr<HybridPdfAnnotationSpec> createAnnotation(
      PdfAnnotationType annotationType, double x, double y, double width, double height) override;

  PoDoFo::PdfPage* getNativePage() const { return _page; }

private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  PoDoFo::PdfPage* _page;
};

} // namespace margelo::nitro::pdfeditor
