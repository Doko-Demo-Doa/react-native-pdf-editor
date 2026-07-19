#include "HybridPdfPage.hpp"
#include "HybridPdfAnnotation.hpp"
#include "HybridPdfPainter.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

double HybridPdfPage::getWidth() {
  return _page->GetRect().Width;
}

double HybridPdfPage::getHeight() {
  return _page->GetRect().Height;
}

double HybridPdfPage::getIndex() {
  // GetIndex() is already the 0-based index (confirmed against the podofo
  // repo's own working JNI wrapper, src/wrapper/podofo_jni.cpp, which uses
  // this same call) — no off-by-one adjustment needed.
  return static_cast<double>(_page->GetIndex());
}

std::shared_ptr<HybridPdfPainterSpec> HybridPdfPage::createPainter() {
  return std::make_shared<HybridPdfPainter>(_doc, _page);
}

double HybridPdfPage::getAnnotationCount() {
  return static_cast<double>(_page->GetAnnotations().GetCount());
}

std::shared_ptr<HybridPdfAnnotationSpec> HybridPdfPage::getAnnotationAt(
    double index) {
  auto& annotation =
      _page->GetAnnotations().GetAnnotAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfAnnotation>(_doc, &annotation);
}

std::shared_ptr<HybridPdfAnnotationSpec> HybridPdfPage::createAnnotation(
    PdfAnnotationType annotationType, double x, double y, double width,
    double height) {
  auto& annotation = _page->GetAnnotations().CreateAnnot(
      toPodofoAnnotationType(annotationType), Rect(x, y, width, height));
  return std::make_shared<HybridPdfAnnotation>(_doc, &annotation);
}

std::vector<PdfTextEntry> HybridPdfPage::extractText(
    const std::optional<std::string>& pattern) {
  std::vector<PoDoFo::PdfTextEntry> podofoEntries;
  _page->ExtractTextTo(podofoEntries, pattern.value_or(std::string()));

  std::vector<PdfTextEntry> entries;
  entries.reserve(podofoEntries.size());
  for (const auto& entry : podofoEntries) {
    entries.emplace_back(entry.Text, entry.X, entry.Y, entry.Length);
  }
  return entries;
}

}  // namespace margelo::nitro::pdfeditor
