#pragma once

#include <podofo/podofo.h>
#include <memory>
#include <mutex>
#include <vector>
#include "HybridPdfDocumentSpec.hpp"

namespace margelo::nitro::pdfeditor {

/**
 * Direct C++ binding onto PoDoFo's PdfMemDocument. Holds the document as a
 * shared_ptr (not unique_ptr) so that HybridPdfPage/HybridPdfFont/
 * HybridPdfImage instances handed out to JS can keep a copy alive
 * independently of this object's own JS lifetime — mirrors (and is safer
 * than) the raw-handle lifetime contract documented on the Android JNI
 * wrapper's PdfPage/PdfFont/PdfImage ("becomes invalid once the owning
 * document is closed").
 *
 * `_mutex` guards every native call into this document's PoDoFo object
 * graph — PdfMemDocument isn't internally thread-safe, and `save()` runs on
 * a background thread (via Promise::async) while the document remains
 * fully callable from JS. It's shared (not copied) with every
 * HybridPdfPage/HybridPdfPainter/HybridPdfField/HybridPdfAnnotation
 * obtained from this document, since those touch the same underlying
 * object graph just as directly as the document's own methods do.
 */
class HybridPdfDocument : public HybridPdfDocumentSpec {
 public:
  explicit HybridPdfDocument(std::shared_ptr<PoDoFo::PdfMemDocument> doc)
      : HybridObject(TAG), _doc(std::move(doc)) {}

  double getPageCount() override;
  std::shared_ptr<HybridPdfPageSpec> getPage(double index) override;
  std::shared_ptr<HybridPdfPageSpec> createPage(double width,
                                                double height) override;
  void removePageAt(double index) override;
  std::shared_ptr<HybridPdfFontSpec> getStandard14Font(
      Standard14FontName name) override;
  std::shared_ptr<HybridPdfFontSpec> loadFont(const std::string& path) override;
  std::shared_ptr<HybridPdfImageSpec> createImageFromBuffer(
      const std::shared_ptr<ArrayBuffer>& data) override;
  std::shared_ptr<Promise<void>> save(const std::string& path) override;

  std::optional<std::string> getTitle() override;
  void setTitle(const std::optional<std::string>& title) override;
  std::optional<std::string> getAuthor() override;
  void setAuthor(const std::optional<std::string>& author) override;
  std::optional<std::string> getSubject() override;
  void setSubject(const std::optional<std::string>& subject) override;
  std::optional<std::string> getCreator() override;
  void setCreator(const std::optional<std::string>& creator) override;

  double getFieldCount() override;
  std::shared_ptr<HybridPdfFieldSpec> getFieldAt(double index) override;
  std::shared_ptr<HybridPdfFieldSpec> createTextBox(
      const std::string& name) override;
  std::shared_ptr<HybridPdfFieldSpec> createCheckBox(
      const std::string& name) override;
  void setEncrypted(const std::string& userPassword,
                    const std::string& ownerPassword,
                    const std::optional<PdfPermissions>& permissions) override;
  bool isEncrypted() override;

  const std::shared_ptr<PoDoFo::PdfMemDocument>& getNativeDocument() const {
    return _doc;
  }

 private:
  std::shared_ptr<PoDoFo::PdfMemDocument> _doc;
  std::shared_ptr<std::mutex> _mutex = std::make_shared<std::mutex>();
  // PdfDocument::CreateImage() returns ownership to the caller as
  // unique_ptr — the underlying image data is already embedded in the
  // document's object graph, but the typed C++ wrapper (needed later e.g.
  // by PdfPainter::DrawImage) must be kept alive by someone. That's us,
  // for as long as this document lives. (Standard-14 fonts don't need
  // this: PdfFontManager/GetFonts() caches and owns them itself.)
  std::vector<std::unique_ptr<PoDoFo::PdfImage>> _images;
};

}  // namespace margelo::nitro::pdfeditor
