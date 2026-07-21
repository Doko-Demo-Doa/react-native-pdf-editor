#include "HybridPdfField.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

PdfFieldType toNitroFieldType(PoDoFo::PdfFieldType type) {
  switch (type) {
    case PoDoFo::PdfFieldType::Unknown:
      return PdfFieldType::UNKNOWN;
    case PoDoFo::PdfFieldType::PushButton:
      return PdfFieldType::PUSHBUTTON;
    case PoDoFo::PdfFieldType::CheckBox:
      return PdfFieldType::CHECKBOX;
    case PoDoFo::PdfFieldType::RadioButton:
      return PdfFieldType::RADIOBUTTON;
    case PoDoFo::PdfFieldType::TextBox:
      return PdfFieldType::TEXTBOX;
    case PoDoFo::PdfFieldType::ComboBox:
      return PdfFieldType::COMBOBOX;
    case PoDoFo::PdfFieldType::ListBox:
      return PdfFieldType::LISTBOX;
    case PoDoFo::PdfFieldType::Signature:
      return PdfFieldType::SIGNATURE;
  }
  return PdfFieldType::UNKNOWN;
}

static PdfSignature& requireSignature(PdfField& field) {
  auto* signature = dynamic_cast<PdfSignature*>(&field);
  if (signature == nullptr) {
    throw std::runtime_error("Field is not a Signature");
  }
  return *signature;
}

static std::optional<std::string> toOptionalNameString(
    const nullable<const PdfName&>& value) {
  if (!value.has_value()) {
    return std::nullopt;
  }
  return std::string(value->GetString());
}

static std::optional<std::string> toOptionalPdfString(
    const nullable<const PdfString&>& value) {
  if (!value.has_value()) {
    return std::nullopt;
  }
  return std::string(value->GetString());
}

static PdfSignatureVerificationStatus toNitroSignatureVerificationStatus(
    PdfSignatureVerifyStatus status) {
  switch (status) {
    case PdfSignatureVerifyStatus::CouldNotVerify:
      return PdfSignatureVerificationStatus::COULDNOTVERIFY;
    case PdfSignatureVerifyStatus::Invalid:
      return PdfSignatureVerificationStatus::INVALID;
    case PdfSignatureVerifyStatus::ValidNoTrust:
      return PdfSignatureVerificationStatus::VALIDNOTRUST;
  }
  return PdfSignatureVerificationStatus::COULDNOTVERIFY;
}

PdfFieldType HybridPdfField::getFieldType() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return toNitroFieldType(_field->GetType());
}

std::string HybridPdfField::getFullName() {
  std::lock_guard<std::mutex> lock(*_mutex);
  return _field->GetFullName();
}

std::optional<std::string> HybridPdfField::getText() {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* textBox = dynamic_cast<PdfTextBox*>(_field);
  if (textBox == nullptr) {
    throw std::runtime_error("Field is not a TextBox");
  }
  auto text = textBox->GetText();
  if (!text.has_value()) {
    return std::nullopt;
  }
  return std::string(text->GetString());
}

void HybridPdfField::setText(const std::optional<std::string>& text) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* textBox = dynamic_cast<PdfTextBox*>(_field);
  if (textBox == nullptr) {
    throw std::runtime_error("Field is not a TextBox");
  }
  textBox->SetText(text.has_value()
                       ? nullable<const PdfString&>(PdfString(*text))
                       : nullptr);
}

bool HybridPdfField::isChecked() {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* toggle = dynamic_cast<PdfToggleButton*>(_field);
  if (toggle == nullptr) {
    throw std::runtime_error("Field is not a CheckBox/RadioButton");
  }
  return toggle->IsChecked();
}

void HybridPdfField::setChecked(bool checked) {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto* toggle = dynamic_cast<PdfToggleButton*>(_field);
  if (toggle == nullptr) {
    throw std::runtime_error("Field is not a CheckBox/RadioButton");
  }
  toggle->SetChecked(checked);
}

PdfSignatureInfo HybridPdfField::getSignatureInfo() {
  std::lock_guard<std::mutex> lock(*_mutex);
  auto& signature = requireSignature(*_field);

  std::optional<std::vector<double>> byteRange;
  auto range = signature.GetByteRange();
  if (range.has_value()) {
    std::vector<double> values;
    values.reserve(range->GetSize());
    for (unsigned i = 0; i < range->GetSize(); i++) {
      int64_t value;
      values.push_back(range->TryGetAtAs(i, value) ? static_cast<double>(value)
                                                   : 0.0);
    }
    byteRange = std::move(values);
  }

  auto signingDate = signature.GetSignatureDate();
  return PdfSignatureInfo{signature.HasSignatureValue(),
                          toOptionalNameString(signature.GetFilter()),
                          toOptionalNameString(signature.GetSubFilter()),
                          toOptionalNameString(signature.GetType()),
                          toOptionalPdfString(signature.GetSignerName()),
                          toOptionalPdfString(signature.GetSignatureReason()),
                          toOptionalPdfString(signature.GetSignatureLocation()),
                          toOptionalPdfString(signature.GetContactInfo()),
                          signingDate.has_value()
                              ? std::optional<std::string>(std::string(
                                    signingDate->ToStringW3C().GetString()))
                              : std::nullopt,
                          byteRange};
}

std::shared_ptr<Promise<PdfSignatureVerificationStatus>>
HybridPdfField::verifySignature(const std::string& documentPath) {
  auto doc = _doc;
  auto mutex = _mutex;
  auto* field = _field;
  return Promise<PdfSignatureVerificationStatus>::async(
      [doc, mutex, field, documentPath]() {
        (void)doc;
        std::lock_guard<std::mutex> lock(*mutex);
        auto& signature = requireSignature(*field);
        FileStreamDevice device(documentPath);
        return toNitroSignatureVerificationStatus(
            signature.TryVerifySignature(device));
      });
}

}  // namespace margelo::nitro::pdfeditor
