#include "HybridPdfPainter.hpp"
#include "HybridPdfFont.hpp"
#include "HybridPdfImage.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

void HybridPdfPainter::setFont(const std::shared_ptr<HybridPdfFontSpec>& font,
                               double fontSize) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* nativeFont = static_cast<HybridPdfFont&>(*font).getNativeFont();
  _painter->TextState.SetFont(*nativeFont, fontSize);
}

void HybridPdfPainter::drawText(const std::string& text, double x, double y) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->DrawText(text, x, y);
}

void HybridPdfPainter::drawImage(
    const std::shared_ptr<HybridPdfImageSpec>& image, double x, double y,
    std::optional<double> scaleX, std::optional<double> scaleY) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* nativeImage = static_cast<HybridPdfImage&>(*image).getNativeImage();
  _painter->DrawImage(*nativeImage, x, y, scaleX.value_or(1.0),
                      scaleY.value_or(1.0));
}

void HybridPdfPainter::drawLine(double x1, double y1, double x2, double y2) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->DrawLine(x1, y1, x2, y2);
}

void HybridPdfPainter::drawRectangle(double x, double y, double width,
                                     double height, bool fill) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->DrawRectangle(
      x, y, width, height,
      fill ? PdfPathDrawMode::Fill : PdfPathDrawMode::Stroke);
}

void HybridPdfPainter::drawCircle(double x, double y, double radius,
                                  bool fill) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->DrawCircle(x, y, radius,
                       fill ? PdfPathDrawMode::Fill : PdfPathDrawMode::Stroke);
}

void HybridPdfPainter::setStrokingColorRGB(double red, double green,
                                           double blue) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->GraphicsState.SetStrokingColor(PdfColor(red, green, blue));
}

void HybridPdfPainter::setNonStrokingColorRGB(double red, double green,
                                              double blue) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->GraphicsState.SetNonStrokingColor(PdfColor(red, green, blue));
}

void HybridPdfPainter::save() {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->Save();
}

void HybridPdfPainter::restore() {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->Restore();
}

void HybridPdfPainter::finishDrawing() {
  std::lock_guard<std::mutex> lock(*_mutex);
  _painter->FinishDrawing();
}

}  // namespace margelo::nitro::pdfeditor
