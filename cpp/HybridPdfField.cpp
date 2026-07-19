#include "HybridPdfField.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

PdfFieldType toNitroFieldType(PoDoFo::PdfFieldType type) {
  switch (type) {
    case PoDoFo::PdfFieldType::Unknown: return PdfFieldType::UNKNOWN;
    case PoDoFo::PdfFieldType::PushButton: return PdfFieldType::PUSHBUTTON;
    case PoDoFo::PdfFieldType::CheckBox: return PdfFieldType::CHECKBOX;
    case PoDoFo::PdfFieldType::RadioButton: return PdfFieldType::RADIOBUTTON;
    case PoDoFo::PdfFieldType::TextBox: return PdfFieldType::TEXTBOX;
    case PoDoFo::PdfFieldType::ComboBox: return PdfFieldType::COMBOBOX;
    case PoDoFo::PdfFieldType::ListBox: return PdfFieldType::LISTBOX;
    case PoDoFo::PdfFieldType::Signature: return PdfFieldType::SIGNATURE;
  }
  return PdfFieldType::UNKNOWN;
}

PdfFieldType HybridPdfField::getFieldType() {
  return toNitroFieldType(_field->GetType());
}

std::string HybridPdfField::getFullName() {
  return _field->GetFullName();
}

std::optional<std::string> HybridPdfField::getText() {
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
  auto* textBox = dynamic_cast<PdfTextBox*>(_field);
  if (textBox == nullptr) {
    throw std::runtime_error("Field is not a TextBox");
  }
  textBox->SetText(text.has_value() ? nullable<const PdfString&>(PdfString(*text)) : nullptr);
}

bool HybridPdfField::isChecked() {
  auto* toggle = dynamic_cast<PdfToggleButton*>(_field);
  if (toggle == nullptr) {
    throw std::runtime_error("Field is not a CheckBox/RadioButton");
  }
  return toggle->IsChecked();
}

void HybridPdfField::setChecked(bool checked) {
  auto* toggle = dynamic_cast<PdfToggleButton*>(_field);
  if (toggle == nullptr) {
    throw std::runtime_error("Field is not a CheckBox/RadioButton");
  }
  toggle->SetChecked(checked);
}

} // namespace margelo::nitro::pdfeditor
