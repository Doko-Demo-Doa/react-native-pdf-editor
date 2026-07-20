#include "HybridPdfEditor.hpp"
#include <CoreGraphics/CoreGraphics.h>
#include <podofo/podofo.h>
#include <algorithm>
#include <cmath>
#include "HybridPdfDocument.hpp"
#include "HybridPdfSigningSession.hpp"

namespace margelo::nitro::pdfeditor {

using namespace PoDoFo;

static std::string toPodofoConformanceLevel(PadesConformanceLevel level) {
  switch (level) {
    case PadesConformanceLevel::B_B:
      return "ADES_B_B";
    case PadesConformanceLevel::B_T:
      return "ADES_B_T";
    case PadesConformanceLevel::B_LT:
      return "ADES_B_LT";
    case PadesConformanceLevel::B_LTA:
      return "ADES_B_LTA";
  }
  throw std::invalid_argument("Unknown PadesConformanceLevel");
}

// PdfRemoteSignDocumentSession takes a digest OID, not an algorithm name —
// confirmed against its hashAlgorithmFromOid() implementation.
static std::string toPodofoHashAlgorithmOid(DigestAlgorithm algorithm) {
  switch (algorithm) {
    case DigestAlgorithm::SHA256:
      return "2.16.840.1.101.3.4.2.1";
    case DigestAlgorithm::SHA384:
      return "2.16.840.1.101.3.4.2.2";
    case DigestAlgorithm::SHA512:
      return "2.16.840.1.101.3.4.2.3";
  }
  throw std::invalid_argument("Unknown DigestAlgorithm");
}

std::shared_ptr<HybridPdfDocumentSpec> HybridPdfEditor::createDocument() {
  auto doc = std::make_shared<PdfMemDocument>();
  return std::make_shared<HybridPdfDocument>(std::move(doc));
}

std::shared_ptr<Promise<std::shared_ptr<HybridPdfDocumentSpec>>>
HybridPdfEditor::openDocument(const std::string& path,
                              const std::optional<std::string>& password) {
  return Promise<std::shared_ptr<HybridPdfDocumentSpec>>::async(
      [path, password]() -> std::shared_ptr<HybridPdfDocumentSpec> {
        auto doc = std::make_shared<PdfMemDocument>();
        doc->Load(path, password.value_or(std::string()));
        return std::make_shared<HybridPdfDocument>(std::move(doc));
      });
}

std::shared_ptr<Promise<bool>> HybridPdfEditor::isEncrypted(
    const std::string& path) {
  return Promise<bool>::async([path]() -> bool {
    PdfMemDocument doc;
    try {
      doc.Load(path, std::string());
    } catch (const PdfError& err) {
      // Loading with an empty password only throws InvalidPassword when the
      // document has a real (non-empty) user password — that's the one
      // error PoDoFo raises *because* the document is encrypted, not
      // because it's broken. Anything else (corrupt file, not a PDF, etc.)
      // should propagate. If the user password is itself empty (or there's
      // no user password at all), Load succeeds here and IsEncrypted()
      // below still reports it correctly.
      if (err.GetCode() == PdfErrorCode::InvalidPassword) {
        return true;
      }
      throw;
    }
    return doc.IsEncrypted();
  });
}

std::shared_ptr<HybridPdfSigningSessionSpec>
HybridPdfEditor::createSigningSession(const PdfSigningSessionOptions& options) {
  auto session = std::make_unique<PdfRemoteSignDocumentSession>(
      toPodofoConformanceLevel(options.conformanceLevel),
      toPodofoHashAlgorithmOid(options.hashAlgorithm), options.inputPath,
      options.outputPath, options.endCertificate, options.certificateChain,
      options.rootCertificate, std::nullopt);
  return std::make_shared<HybridPdfSigningSession>(std::move(session));
}

namespace {

// RAII helpers so early-return error paths (thrown exceptions) can't leak
// the CoreGraphics objects below.
struct CFReleaser {
  void operator()(CFTypeRef ref) const {
    if (ref != nullptr)
      CFRelease(ref);
  }
};

using CGPDFDocumentPtr =
    std::unique_ptr<std::remove_pointer_t<CGPDFDocumentRef>, CFReleaser>;
using CGContextPtr =
    std::unique_ptr<std::remove_pointer_t<CGContextRef>, CFReleaser>;
using CGColorSpacePtr =
    std::unique_ptr<std::remove_pointer_t<CGColorSpaceRef>, CFReleaser>;

}  // namespace

std::shared_ptr<Promise<PdfPageBitmap>> HybridPdfEditor::renderPageToBitmap(
    const RenderPageOptions& options) {
  return Promise<PdfPageBitmap>::async([options]() -> PdfPageBitmap {
    double scale = options.scale.value_or(1.0);
    if (scale <= 0) {
      throw std::invalid_argument("scale must be > 0");
    }

    CFURLRef rawUrl = CFURLCreateFromFileSystemRepresentation(
        kCFAllocatorDefault,
        reinterpret_cast<const UInt8*>(options.path.c_str()),
        static_cast<CFIndex>(options.path.size()), false);
    if (rawUrl == nullptr) {
      throw std::runtime_error("Invalid path: " + options.path);
    }
    CGPDFDocumentPtr document(CGPDFDocumentCreateWithURL(rawUrl));
    CFRelease(rawUrl);
    if (!document) {
      throw std::runtime_error("Failed to open PDF: " + options.path);
    }

    // CGPDFDocument pages are 1-based.
    CGPDFPageRef page = CGPDFDocumentGetPage(
        document.get(), static_cast<size_t>(options.pageIndex) + 1);
    if (page == nullptr) {
      throw std::runtime_error(
          "Page index out of range: " +
          std::to_string(static_cast<long>(options.pageIndex)));
    }

    CGRect mediaBox = CGPDFPageGetBoxRect(page, kCGPDFMediaBox);
    double pageWidth = mediaBox.size.width;
    double pageHeight = mediaBox.size.height;
    // A page rotated 90/270 degrees renders visually swapped from its raw
    // MediaBox — the destination bitmap must match the *visual* dimensions,
    // not the raw box, or CGPDFPageGetDrawingTransform below will scale the
    // (already-rotated) content to fit the wrong aspect ratio.
    int rotation = CGPDFPageGetRotationAngle(page);
    if (rotation == 90 || rotation == 270) {
      std::swap(pageWidth, pageHeight);
    }

    int width = static_cast<int>(std::ceil(pageWidth * scale));
    int height = static_cast<int>(std::ceil(pageHeight * scale));
    if (width <= 0 || height <= 0) {
      throw std::runtime_error("Page has invalid dimensions");
    }

    size_t bytesPerRow = static_cast<size_t>(width) * 4;
    size_t dataSize = bytesPerRow * static_cast<size_t>(height);
    auto buffer = ArrayBuffer::allocate(dataSize);

    CGColorSpacePtr colorSpace(CGColorSpaceCreateDeviceRGB());
    CGContextPtr context(CGBitmapContextCreate(
        buffer->data(), static_cast<size_t>(width), static_cast<size_t>(height),
        8, bytesPerRow, colorSpace.get(),
        kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big));
    if (!context) {
      throw std::runtime_error("Failed to create bitmap context");
    }

    // White background, then draw the page directly — no manual flip here.
    // Verified empirically (not just derived): a CGBitmapContext created
    // with an explicit `data` buffer already writes row 0 of that buffer to
    // the top of the image while keeping Quartz's native bottom-up logical
    // coordinate space for drawing, so PDF content at low y (bottom of the
    // page) lands in the buffer's bottom rows with no extra flip needed. An
    // earlier version of this code added a translate+scale flip "to handle
    // the bottom-up/top-down mismatch," which actually inverted it — caught
    // by rendering a page with a black square in a known corner and
    // checking the output bitmap's pixels numerically; the square came out
    // at the top instead of the bottom until this flip was removed.
    CGContextSetRGBFillColor(context.get(), 1.0, 1.0, 1.0, 1.0);
    CGContextFillRect(context.get(), CGRectMake(0, 0, width, height));
    // rotate=0: apply only the page's own baked-in /Rotate, no extra spin —
    // the destination rect above already accounts for it via the swap.
    CGAffineTransform transform = CGPDFPageGetDrawingTransform(
        page, kCGPDFMediaBox, CGRectMake(0, 0, width, height), 0, true);
    CGContextConcatCTM(context.get(), transform);
    CGContextDrawPDFPage(context.get(), page);

    return PdfPageBitmap(
        buffer, static_cast<double>(width), static_cast<double>(height),
        static_cast<double>(bytesPerRow), std::string("RGBA8888"));
  });
}

}  // namespace margelo::nitro::pdfeditor
