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
  return static_cast<double>(_doc->GetPages().GetCount());
}

std::shared_ptr<HybridPdfPageSpec> HybridPdfDocument::getPage(double index) {
  auto& page = _doc->GetPages().GetPageAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfPage>(_doc, &page);
}

std::shared_ptr<HybridPdfPageSpec> HybridPdfDocument::createPage(
    double width, double height) {
  auto& page = _doc->GetPages().CreatePage(Rect(0, 0, width, height));
  return std::make_shared<HybridPdfPage>(_doc, &page);
}

void HybridPdfDocument::removePageAt(double index) {
  _doc->GetPages().RemovePageAt(static_cast<unsigned>(index));
}

std::shared_ptr<HybridPdfFontSpec> HybridPdfDocument::getStandard14Font(
    Standard14FontName name) {
  // PdfFontManager (PdfDocument::GetFonts()) owns and caches standard-14
  // fonts itself — no need to keep our own reference alive (confirmed
  // against the podofo repo's own working JNI wrapper implementation,
  // src/wrapper/podofo_jni.cpp, which uses this same call).
  auto& font = _doc->GetFonts().GetStandard14Font(toPodofoStandard14(name));
  return std::make_shared<HybridPdfFont>(&font);
}

std::shared_ptr<HybridPdfImageSpec> HybridPdfDocument::createImageFromBuffer(
    const std::shared_ptr<ArrayBuffer>& data) {
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
  return Promise<void>::async([doc, path]() { doc->Save(path); });
}

std::optional<std::string> HybridPdfDocument::getTitle() {
  return toOptionalString(_doc->GetMetadata().GetTitle());
}

void HybridPdfDocument::setTitle(const std::optional<std::string>& title) {
  _doc->GetMetadata().SetTitle(
      title.has_value() ? nullable<const PdfString&>(PdfString(*title))
                        : nullptr);
}

std::optional<std::string> HybridPdfDocument::getAuthor() {
  return toOptionalString(_doc->GetMetadata().GetAuthor());
}

void HybridPdfDocument::setAuthor(const std::optional<std::string>& author) {
  _doc->GetMetadata().SetAuthor(
      author.has_value() ? nullable<const PdfString&>(PdfString(*author))
                         : nullptr);
}

std::optional<std::string> HybridPdfDocument::getSubject() {
  return toOptionalString(_doc->GetMetadata().GetSubject());
}

void HybridPdfDocument::setSubject(const std::optional<std::string>& subject) {
  _doc->GetMetadata().SetSubject(
      subject.has_value() ? nullable<const PdfString&>(PdfString(*subject))
                          : nullptr);
}

std::optional<std::string> HybridPdfDocument::getCreator() {
  return toOptionalString(_doc->GetMetadata().GetCreator());
}

void HybridPdfDocument::setCreator(const std::optional<std::string>& creator) {
  _doc->GetMetadata().SetCreator(
      creator.has_value() ? nullable<const PdfString&>(PdfString(*creator))
                          : nullptr);
}

double HybridPdfDocument::getFieldCount() {
  auto* form = _doc->GetAcroForm();
  return form == nullptr ? 0 : static_cast<double>(form->GetFieldCount());
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::getFieldAt(
    double index) {
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.GetFieldAt(static_cast<unsigned>(index));
  return std::make_shared<HybridPdfField>(_doc, &field);
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::createTextBox(
    const std::string& name) {
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.CreateField(name, PoDoFo::PdfFieldType::TextBox);
  return std::make_shared<HybridPdfField>(_doc, &field);
}

std::shared_ptr<HybridPdfFieldSpec> HybridPdfDocument::createCheckBox(
    const std::string& name) {
  auto& form = _doc->GetOrCreateAcroForm();
  auto& field = form.CreateField(name, PoDoFo::PdfFieldType::CheckBox);
  return std::make_shared<HybridPdfField>(_doc, &field);
}

void HybridPdfDocument::setEncrypted(
    const std::string& userPassword, const std::string& ownerPassword,
    const std::optional<PdfPermissions>& permissions) {
  _doc->SetEncrypted(userPassword, ownerPassword,
                     toPodofoPermissions(permissions));
}

bool HybridPdfDocument::isEncrypted() {
  return _doc->IsEncrypted();
}

}  // namespace margelo::nitro::pdfeditor
