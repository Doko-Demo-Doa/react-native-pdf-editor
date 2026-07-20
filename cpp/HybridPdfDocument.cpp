#include "HybridPdfDocument.hpp"
#include "HybridPdfField.hpp"
#include "HybridPdfFont.hpp"
#include "HybridPdfImage.hpp"
#include "HybridPdfPage.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

static PdfStandard14FontType toPodofoStandard14(Standard14FontName name) {
  switch (name) {
    case Standard14FontName::TIMESROMAN:
      return PdfStandard14FontType::TimesRoman;
    case Standard14FontName::TIMESITALIC:
      return PdfStandard14FontType::TimesItalic;
    case Standard14FontName::TIMESBOLD:
      return PdfStandard14FontType::TimesBold;
    case Standard14FontName::TIMESBOLDITALIC:
      return PdfStandard14FontType::TimesBoldItalic;
    case Standard14FontName::HELVETICA:
      return PdfStandard14FontType::Helvetica;
    case Standard14FontName::HELVETICAOBLIQUE:
      return PdfStandard14FontType::HelveticaOblique;
    case Standard14FontName::HELVETICABOLD:
      return PdfStandard14FontType::HelveticaBold;
    case Standard14FontName::HELVETICABOLDOBLIQUE:
      return PdfStandard14FontType::HelveticaBoldOblique;
    case Standard14FontName::COURIER:
      return PdfStandard14FontType::Courier;
    case Standard14FontName::COURIEROBLIQUE:
      return PdfStandard14FontType::CourierOblique;
    case Standard14FontName::COURIERBOLD:
      return PdfStandard14FontType::CourierBold;
    case Standard14FontName::COURIERBOLDOBLIQUE:
      return PdfStandard14FontType::CourierBoldOblique;
    case Standard14FontName::SYMBOL:
      return PdfStandard14FontType::Symbol;
    case Standard14FontName::ZAPFDINGBATS:
      return PdfStandard14FontType::ZapfDingbats;
  }
  throw std::invalid_argument("Unknown Standard14FontName");
}

static std::optional<std::string> toOptionalString(
    const nullable<const PdfString&>& value) {
  if (!value.has_value()) {
    return std::nullopt;
  }
  return std::string(value->GetString());
}

static PoDoFo::PdfPermissions toPodofoPermissions(
    const std::optional<PdfPermissions>& permissions) {
  if (!permissions.has_value()) {
    return PoDoFo::PdfPermissions::Default;
  }
  PoDoFo::PdfPermissions result = PoDoFo::PdfPermissions::None;
  const auto& p = *permissions;
  if (p.print.value_or(true))
    result |= PoDoFo::PdfPermissions::Print;
  if (p.edit.value_or(true))
    result |= PoDoFo::PdfPermissions::Edit;
  if (p.copy.value_or(true))
    result |= PoDoFo::PdfPermissions::Copy;
  if (p.editNotes.value_or(true))
    result |= PoDoFo::PdfPermissions::EditNotes;
  if (p.fillAndSign.value_or(true))
    result |= PoDoFo::PdfPermissions::FillAndSign;
  if (p.accessible.value_or(true))
    result |= PoDoFo::PdfPermissions::Accessible;
  if (p.docAssembly.value_or(true))
    result |= PoDoFo::PdfPermissions::DocAssembly;
  if (p.highPrint.value_or(true))
    result |= PoDoFo::PdfPermissions::HighPrint;
  return result;
}

double HybridPdfDocument::getPageCount() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return static_cast<double>(_doc->GetPages().GetCount());
}

std::shared_ptr<HybridPdfPageSpec> HybridPdfDocument::getPage(double index) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& page = _doc->GetPages().GetPageAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfPage>(_doc, _mutex, &page);
}

std::shared_ptr<HybridPdfPageSpec> HybridPdfDocument::createPage(
    double width, double height) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& page = _doc->GetPages().CreatePage(Rect(0, 0, width, height));
  return std::make_shared<HybridPdfPage>(_doc, _mutex, &page);
}

std::shared_ptr<HybridPdfPageSpec> HybridPdfDocument::createPageAt(
    double index, double width, double height) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& page = _doc->GetPages().CreatePageAt(static_cast<unsigned>(index),
                                             Rect(0, 0, width, height));
  return std::make_shared<HybridPdfPage>(_doc, _mutex, &page);
}

void HybridPdfDocument::removePageAt(double index) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->GetPages().RemovePageAt(static_cast<unsigned>(index));
}

void HybridPdfDocument::appendPagesFrom(
    const std::shared_ptr<HybridPdfDocumentSpec>& source) {
  auto& src = static_cast<HybridPdfDocument&>(*source);
  if (&src == this) {
    throw std::invalid_argument("Cannot merge a document into itself");
  }
  // Locks both documents (ordered internally by std::scoped_lock to avoid
  // deadlock if two documents are merged into each other concurrently from
  // different threads) since this reads the source's page tree while
  // writing to this document's.
  std::scoped_lock lock(*_mutex, *src._mutex);
  _doc->GetPages().AppendDocumentPages(*src._doc);
}

void HybridPdfDocument::appendPageRangeFrom(
    const std::shared_ptr<HybridPdfDocumentSpec>& source, double pageIndex,
    double pageCount) {
  auto& src = static_cast<HybridPdfDocument&>(*source);
  if (&src == this) {
    throw std::invalid_argument("Cannot merge a document into itself");
  }
  std::scoped_lock lock(*_mutex, *src._mutex);
  _doc->GetPages().AppendDocumentPages(*src._doc,
                                       static_cast<unsigned>(pageIndex),
                                       static_cast<unsigned>(pageCount));
}

void HybridPdfDocument::insertPageFrom(
    double atIndex, const std::shared_ptr<HybridPdfDocumentSpec>& source,
    double pageIndex) {
  auto& src = static_cast<HybridPdfDocument&>(*source);
  if (&src == this) {
    throw std::invalid_argument("Cannot merge a document into itself");
  }
  std::scoped_lock lock(*_mutex, *src._mutex);
  _doc->GetPages().InsertDocumentPageAt(static_cast<unsigned>(atIndex),
                                        *src._doc,
                                        static_cast<unsigned>(pageIndex));
}

std::shared_ptr<HybridPdfFontSpec> HybridPdfDocument::getStandard14Font(
    Standard14FontName name) {
  std::lock_guard<std::mutex> lock(*_mutex);
  // PdfFontManager (PdfDocument::GetFonts()) owns and caches standard-14
  // fonts itself — no need to keep our own reference alive (confirmed
  // against the podofo repo's own working JNI wrapper implementation,
  // src/wrapper/podofo_jni.cpp, which uses this same call).
  auto& font = _doc->GetFonts().GetStandard14Font(toPodofoStandard14(name));
  return std::make_shared<HybridPdfFont>(&font);
}

std::shared_ptr<HybridPdfFontSpec> HybridPdfDocument::loadFont(
    const std::string& path) {
  std::lock_guard<std::mutex> lock(*_mutex);
  // PdfFontManager caches by path and owns the result itself (same as
  // GetStandard14Font above) — repeated calls with the same path are cheap
  // and return the same underlying font.
  auto& font = _doc->GetFonts().GetOrCreateFont(path);
  return std::make_shared<HybridPdfFont>(&font);
}

std::shared_ptr<HybridPdfFontSpec> HybridPdfDocument::loadFontFromBuffer(
    const std::shared_ptr<ArrayBuffer>& data) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& font = _doc->GetFonts().GetOrCreateFontFromBuffer(
      bufferview(reinterpret_cast<const char*>(data->data()), data->size()));
  return std::make_shared<HybridPdfFont>(&font);
}

std::shared_ptr<HybridPdfImageSpec> HybridPdfDocument::createImageFromBuffer(
    const std::shared_ptr<ArrayBuffer>& data) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto image = _doc->CreateImage();
  image->LoadFromBuffer(
      bufferview(reinterpret_cast<const char*>(data->data()), data->size()));
  PdfImage* rawImage = image.get();
  _images.push_back(std::move(image));
  return std::make_shared<HybridPdfImage>(rawImage);
}

std::shared_ptr<Promise<void>> HybridPdfDocument::save(
    const std::string& path) {
  auto doc = _doc;
  auto mutex = _mutex;
  return Promise<void>::async([doc, mutex, path]() {
    std::lock_guard<std::mutex> lock(*mutex);
    doc->Save(path);
  });
}

std::optional<std::string> HybridPdfDocument::getTitle() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return toOptionalString(_doc->GetMetadata().GetTitle());
}

void HybridPdfDocument::setTitle(const std::optional<std::string>& title) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->GetMetadata().SetTitle(
      title.has_value() ? nullable<const PdfString&>(PdfString(*title))
                        : nullptr);
}

std::optional<std::string> HybridPdfDocument::getAuthor() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return toOptionalString(_doc->GetMetadata().GetAuthor());
}

void HybridPdfDocument::setAuthor(const std::optional<std::string>& author) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->GetMetadata().SetAuthor(
      author.has_value() ? nullable<const PdfString&>(PdfString(*author))
                         : nullptr);
}

std::optional<std::string> HybridPdfDocument::getSubject() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return toOptionalString(_doc->GetMetadata().GetSubject());
}

void HybridPdfDocument::setSubject(const std::optional<std::string>& subject) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->GetMetadata().SetSubject(
      subject.has_value() ? nullable<const PdfString&>(PdfString(*subject))
                          : nullptr);
}

std::optional<std::string> HybridPdfDocument::getCreator() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return toOptionalString(_doc->GetMetadata().GetCreator());
}

void HybridPdfDocument::setCreator(const std::optional<std::string>& creator) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->GetMetadata().SetCreator(
      creator.has_value() ? nullable<const PdfString&>(PdfString(*creator))
                          : nullptr);
}

double HybridPdfDocument::getFieldCount() {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* form = _doc->GetAcroForm();
  return form == nullptr ? 0 : static_cast<double>(form->GetFieldCount());
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::getFieldAt(
    double index) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.GetFieldAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfField>(_doc, _mutex, &field);
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::createTextBox(
    const std::string& name) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.CreateField(name, PoDoFo::PdfFieldType::TextBox);
  return std::make_shared<HybridPdfField>(_doc, _mutex, &field);
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::createCheckBox(
    const std::string& name) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.CreateField(name, PoDoFo::PdfFieldType::CheckBox);
  return std::make_shared<HybridPdfField>(_doc, _mutex, &field);
}

void HybridPdfDocument::setEncrypted(
    const std::string& userPassword, const std::string& ownerPassword,
    const std::optional<PdfPermissions>& permissions) {
  std::lock_guard<std::mutex> lock(*_mutex);
  _doc->SetEncrypted(userPassword, ownerPassword,
                     toPodofoPermissions(permissions));
}

bool HybridPdfDocument::isEncrypted() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return _doc->IsEncrypted();
}

}  // namespace margelo::nitro::pdfeditor
