#include "HybridPdfImage.hpp"

namespace margelo::nitro::pdfeditor {

double HybridPdfImage::getWidth() {
  return static_cast<double>(_image->GetWidth());
}

double HybridPdfImage::getHeight() {
  return static_cast<double>(_image->GetHeight());
}

} // namespace margelo::nitro::pdfeditor
