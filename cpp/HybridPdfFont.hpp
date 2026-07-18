#pragma once

#include "HybridPdfFontSpec.hpp"
#include <podofo/podofo.h>

namespace margelo::nitro::pdfeditor {

/**
 * Opaque handle onto a PoDoFo::PdfFont owned (kept alive) by its parent
 * HybridPdfDocument. No methods of its own yet — just passed to
 * PdfPainter::setFont.
 */
class HybridPdfFont : public HybridPdfFontSpec {
public:
  explicit HybridPdfFont(PoDoFo::PdfFont* font) : HybridObject(TAG), _font(font) {}

  PoDoFo::PdfFont* getNativeFont() const { return _font; }

private:
  PoDoFo::PdfFont* _font;
};

} // namespace margelo::nitro::pdfeditor
