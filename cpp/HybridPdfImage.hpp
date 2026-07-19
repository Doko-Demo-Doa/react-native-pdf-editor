#pragma once

#include <podofo/podofo.h>
#include "HybridPdfImageSpec.hpp"

namespace margelo::nitro::pdfeditor {

/**
 * Handle onto a PoDoFo::PdfImage owned (kept alive) by its parent
 * HybridPdfDocument, obtained from PdfDocument.createImageFromBuffer and
 * drawn onto a page via PdfPainter.drawImage.
 */
class HybridPdfImage : public HybridPdfImageSpec {
 public:
  explicit HybridPdfImage(PoDoFo::PdfImage* image)
      : HybridObject(TAG), _image(image) {}

  double getWidth() override;
  double getHeight() override;

  PoDoFo::PdfImage* getNativeImage() const { return _image; }

 private:
  PoDoFo::PdfImage* _image;
};

}  // namespace margelo::nitro::pdfeditor
