#pragma once

#include <podofo/podofo.h>
#include <memory>
#include <mutex>
#include "HybridPdfPageSpec.hpp"

namespace margelo::nitro::pdfeditor {

/**
 * Wraps a raw PoDoFo::PdfPage* owned by its document's page tree. Holds a
 * shared_ptr to the owning PdfMemDocument (not just the HybridPdfDocument
 * wrapper) so the underlying page memory stays alive for as long as any JS
 * reference to this page exists, even if the JS PdfDocument object itself
 * has already been garbage collected.
 *
 * `mutex` is the same one shared by the owning HybridPdfDocument (and every
 * other Page/Painter/Field/Annotation obtained from it) — see
 * HybridPdfDocument.hpp for why.
 */
class HybridPdfPage : public HybridPdfPageSpec {
 public:
  HybridPdfPage(std::shared_ptr<PoDoFo::PdfMemDocument> doc,
                std::shared_ptr<std::mutex> mutex, PoDoFo::PdfPage* page)
      : HybridObject(TAG),
        _doc(std::move(doc)),
        _mutex(std::move(mutex)),
        _page(page) {}

  double getWidth() override;
  double getHeight() override;
  double getIndex() override;

  double getRotation() override;
  void setRotation(double rotation) override;
  PdfRect getMediaBox() override;
  void setMediaBox(double x, double y, double width, double height) override;
  PdfRect getCropBox() override;
  void setCropBox(double x, double y, double width, double height) override;
  bool moveTo(double newIndex) override;

  std::shared_ptr<HybridPdfPainterSpec> createPainter() override;
  double getAnnotationCount() override;
  std::shared_ptr<HybridPdfAnnotationSpec> getAnnotationAt(
      double index) override;
  std::shared_ptr<HybridPdfAnnotationSpec> createAnnotation(
      PdfAnnotationType annotationType, double x, double y, double width,
      double height) override;
  std::vector<PdfTextEntry> extractText(
      const std::optional<std::string>& pattern) override;

  PoDoFo::PdfPage* getNativePage() const { return _page; }

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  std::shared_ptr<std::mutex> _mutex;
  PoDoFo::PdfPage* _page;
};

}  // namespace margelo::nitro::pdfeditor
