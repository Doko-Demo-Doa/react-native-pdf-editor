#include "HybridPdfAnnotation.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

PoDoFo::PdfAnnotationType toPodofoAnnotationType(PdfAnnotationType type) {
  switch (type) {
    case PdfAnnotationType::UNKNOWN:
      return PoDoFo::PdfAnnotationType::Unknown;
    case PdfAnnotationType::TEXT:
      return PoDoFo::PdfAnnotationType::Text;
    case PdfAnnotationType::LINK:
      return PoDoFo::PdfAnnotationType::Link;
    case PdfAnnotationType::FREETEXT:
      return PoDoFo::PdfAnnotationType::FreeText;
    case PdfAnnotationType::LINE:
      return PoDoFo::PdfAnnotationType::Line;
    case PdfAnnotationType::SQUARE:
      return PoDoFo::PdfAnnotationType::Square;
    case PdfAnnotationType::CIRCLE:
      return PoDoFo::PdfAnnotationType::Circle;
    case PdfAnnotationType::POLYGON:
      return PoDoFo::PdfAnnotationType::Polygon;
    case PdfAnnotationType::POLYLINE:
      return PoDoFo::PdfAnnotationType::PolyLine;
    case PdfAnnotationType::HIGHLIGHT:
      return PoDoFo::PdfAnnotationType::Highlight;
    case PdfAnnotationType::UNDERLINE:
      return PoDoFo::PdfAnnotationType::Underline;
    case PdfAnnotationType::SQUIGGLY:
      return PoDoFo::PdfAnnotationType::Squiggly;
    case PdfAnnotationType::STRIKEOUT:
      return PoDoFo::PdfAnnotationType::StrikeOut;
    case PdfAnnotationType::STAMP:
      return PoDoFo::PdfAnnotationType::Stamp;
    case PdfAnnotationType::CARET:
      return PoDoFo::PdfAnnotationType::Caret;
    case PdfAnnotationType::INK:
      return PoDoFo::PdfAnnotationType::Ink;
    case PdfAnnotationType::POPUP:
      return PoDoFo::PdfAnnotationType::Popup;
    case PdfAnnotationType::FILEATTACHMENT:
      return PoDoFo::PdfAnnotationType::FileAttachement;
    case PdfAnnotationType::SOUND:
      return PoDoFo::PdfAnnotationType::Sound;
    case PdfAnnotationType::MOVIE:
      return PoDoFo::PdfAnnotationType::Movie;
    case PdfAnnotationType::WIDGET:
      return PoDoFo::PdfAnnotationType::Widget;
    case PdfAnnotationType::SCREEN:
      return PoDoFo::PdfAnnotationType::Screen;
    case PdfAnnotationType::PRINTERMARK:
      return PoDoFo::PdfAnnotationType::PrinterMark;
    case PdfAnnotationType::TRAPNET:
      return PoDoFo::PdfAnnotationType::TrapNet;
    case PdfAnnotationType::WATERMARK:
      return PoDoFo::PdfAnnotationType::Watermark;
    case PdfAnnotationType::_3D:
      return PoDoFo::PdfAnnotationType::Model3D;
    case PdfAnnotationType::RICHMEDIA:
      return PoDoFo::PdfAnnotationType::RichMedia;
    case PdfAnnotationType::WEBMEDIA:
      return PoDoFo::PdfAnnotationType::WebMedia;
    case PdfAnnotationType::REDACT:
      return PoDoFo::PdfAnnotationType::Redact;
    case PdfAnnotationType::PROJECTION:
      return PoDoFo::PdfAnnotationType::Projection;
  }
  return PoDoFo::PdfAnnotationType::Unknown;
}

PdfAnnotationType toNitroAnnotationType(PoDoFo::PdfAnnotationType type) {
  switch (type) {
    case PoDoFo::PdfAnnotationType::Unknown:
      return PdfAnnotationType::UNKNOWN;
    case PoDoFo::PdfAnnotationType::Text:
      return PdfAnnotationType::TEXT;
    case PoDoFo::PdfAnnotationType::Link:
      return PdfAnnotationType::LINK;
    case PoDoFo::PdfAnnotationType::FreeText:
      return PdfAnnotationType::FREETEXT;
    case PoDoFo::PdfAnnotationType::Line:
      return PdfAnnotationType::LINE;
    case PoDoFo::PdfAnnotationType::Square:
      return PdfAnnotationType::SQUARE;
    case PoDoFo::PdfAnnotationType::Circle:
      return PdfAnnotationType::CIRCLE;
    case PoDoFo::PdfAnnotationType::Polygon:
      return PdfAnnotationType::POLYGON;
    case PoDoFo::PdfAnnotationType::PolyLine:
      return PdfAnnotationType::POLYLINE;
    case PoDoFo::PdfAnnotationType::Highlight:
      return PdfAnnotationType::HIGHLIGHT;
    case PoDoFo::PdfAnnotationType::Underline:
      return PdfAnnotationType::UNDERLINE;
    case PoDoFo::PdfAnnotationType::Squiggly:
      return PdfAnnotationType::SQUIGGLY;
    case PoDoFo::PdfAnnotationType::StrikeOut:
      return PdfAnnotationType::STRIKEOUT;
    case PoDoFo::PdfAnnotationType::Stamp:
      return PdfAnnotationType::STAMP;
    case PoDoFo::PdfAnnotationType::Caret:
      return PdfAnnotationType::CARET;
    case PoDoFo::PdfAnnotationType::Ink:
      return PdfAnnotationType::INK;
    case PoDoFo::PdfAnnotationType::Popup:
      return PdfAnnotationType::POPUP;
    case PoDoFo::PdfAnnotationType::FileAttachement:
      return PdfAnnotationType::FILEATTACHMENT;
    case PoDoFo::PdfAnnotationType::Sound:
      return PdfAnnotationType::SOUND;
    case PoDoFo::PdfAnnotationType::Movie:
      return PdfAnnotationType::MOVIE;
    case PoDoFo::PdfAnnotationType::Widget:
      return PdfAnnotationType::WIDGET;
    case PoDoFo::PdfAnnotationType::Screen:
      return PdfAnnotationType::SCREEN;
    case PoDoFo::PdfAnnotationType::PrinterMark:
      return PdfAnnotationType::PRINTERMARK;
    case PoDoFo::PdfAnnotationType::TrapNet:
      return PdfAnnotationType::TRAPNET;
    case PoDoFo::PdfAnnotationType::Watermark:
      return PdfAnnotationType::WATERMARK;
    case PoDoFo::PdfAnnotationType::Model3D:
      return PdfAnnotationType::_3D;
    case PoDoFo::PdfAnnotationType::RichMedia:
      return PdfAnnotationType::RICHMEDIA;
    case PoDoFo::PdfAnnotationType::WebMedia:
      return PdfAnnotationType::WEBMEDIA;
    case PoDoFo::PdfAnnotationType::Redact:
      return PdfAnnotationType::REDACT;
    case PoDoFo::PdfAnnotationType::Projection:
      return PdfAnnotationType::PROJECTION;
    default:
      return PdfAnnotationType::UNKNOWN;
  }
}

PdfAnnotationType HybridPdfAnnotation::getAnnotationType() {
  return toNitroAnnotationType(_annotation->GetType());
}

PdfRect HybridPdfAnnotation::getRect() {
  auto rect = _annotation->GetRect();
  return PdfRect(rect.X, rect.Y, rect.Width, rect.Height);
}

void HybridPdfAnnotation::setRect(double x, double y, double width,
                                  double height) {
  _annotation->SetRect(Rect(x, y, width, height));
}

std::optional<std::string> HybridPdfAnnotation::getContents() {
  auto contents = _annotation->GetContents();
  if (!contents.has_value()) {
    return std::nullopt;
  }
  return std::string(contents->GetString());
}

void HybridPdfAnnotation::setContents(
    const std::optional<std::string>& contents) {
  _annotation->SetContents(
      contents.has_value() ? nullable<const PdfString&>(PdfString(*contents))
                           : nullptr);
}

}  // namespace margelo::nitro::pdfeditor
