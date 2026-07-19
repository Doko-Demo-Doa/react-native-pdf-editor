#pragma once

#include <podofo/podofo.h>
#include <memory>
#include <mutex>
#include "HybridPdfPainterSpec.hpp"

namespace margelo::nitro::pdfeditor {

/**
 * Owns a fresh PoDoFo::PdfPainter bound to a page's canvas via SetCanvas.
 * Holds the owning document alive so the page (and thus this painter's
 * canvas) stays valid for the painter's lifetime.
 *
 * `_mutex` is the same one shared by the owning HybridPdfDocument — see
 * HybridPdfDocument.hpp for why.
 */
class HybridPdfPainter : public HybridPdfPainterSpec {
 public:
  HybridPdfPainter(std::shared_ptr<PoDoFo::PdfMemDocument> doc,
                   std::shared_ptr<std::mutex> mutex, PoDoFo::PdfPage* page)
      : HybridObject(TAG),
        _doc(std::move(doc)),
        _mutex(std::move(mutex)),
        _painter(std::make_unique<PoDoFo::PdfPainter>()) {
    _painter->SetCanvas(*page);
  }

  // PoDoFo::PdfPainter's destructor is `noexcept(false)` (it can throw if
  // FinishDrawing() was never called), which would make our implicit
  // destructor "more lax" than HybridPdfPainterSpec's implicitly-noexcept
  // virtual destructor — an invalid override. Holding the painter behind a
  // unique_ptr and destroying it explicitly inside a noexcept, try/catch-
  // wrapped destructor sidesteps that without silently swallowing the
  // exception-safety issue elsewhere.
  ~HybridPdfPainter() noexcept override {
    try {
      std::lock_guard<std::mutex> lock(*_mutex);
      _painter.reset();
    } catch (...) {}
  }

  void setFont(const std::shared_ptr<HybridPdfFontSpec>& font,
               double fontSize) override;
  void drawText(const std::string& text, double x, double y) override;
  void drawImage(const std::shared_ptr<HybridPdfImageSpec>& image, double x,
                 double y, std::optional<double> scaleX,
                 std::optional<double> scaleY) override;
  void drawLine(double x1, double y1, double x2, double y2) override;
  void drawRectangle(double x, double y, double width, double height,
                     bool fill) override;
  void drawCircle(double x, double y, double radius, bool fill) override;
  void setStrokingColorRGB(double red, double green, double blue) override;
  void setNonStrokingColorRGB(double red, double green, double blue) override;
  void save() override;
  void restore() override;
  void finishDrawing() override;

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  std::shared_ptr<std::mutex> _mutex;
  std::unique_ptr<PoDoFo::PdfPainter> _painter;
};

}  // namespace margelo::nitro::pdfeditor
