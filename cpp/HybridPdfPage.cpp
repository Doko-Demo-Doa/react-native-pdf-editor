#include "HybridPdfPage.hpp"
#include "HybridPdfPainter.hpp"
#include "HybridPdfAnnotation.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

double HybridPdfPage::getWidth() {
  return _page->GetRect().Width;
}

double HybridPdfPage::getHeight() {
  return _page->GetRect().Height;
}

double HybridPdfPage::getIndex() {
  // PoDoFo's GetPageNumber() is 1-based; our API (matching the Android JNI
  // wrapper) is 0-based to mirror how the page was obtained/created.
  return static_cast<double>(_page->GetPageNumber() - 1);
}

std::shared_ptr<HybridPdfPainterSpec> HybridPdfPage::createPainter() {
  return std::make_shared<HybridPdfPainter>(_doc, _page);
}

double HybridPdfPage::getAnnotationCount() {
  return static_cast<double>(_page->GetAnnotations().GetCount());
}

std::shared_ptr<HybridPdfAnnotationSpec> HybridPdfPage::getAnnotationAt(double index) {
  auto& annotation = _page->GetAnnotations().GetAnnotAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfAnnotation>(_doc, &annotation);
}

std::shared_ptr<HybridPdfAnnotationSpec> HybridPdfPage::createAnnotation(
    PdfAnnotationType annotationType, double x, double y, double width, double height) {
  auto& annotation = _page->GetAnnotations().CreateAnnot(
      toPodofoAnnotationType(annotationType), Rect(x, y, width, height));
  return std::make_shared<HybridPdfAnnotation>(_doc, &annotation);
}

} // namespace margelo::nitro::pdfeditor
