#include "HybridPdfEditor.hpp"
#include <CoreGraphics/CoreGraphics.h>
#include <ImageIO/ImageIO.h>
#include <podofo/podofo.h>
#include <algorithm>
#include <cmath>
#include <type_traits>
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

template <typename T, typename = void>
struct HasVisibleTextSignatureSetter : std::false_type {};

template <typename T>
struct HasVisibleTextSignatureSetter<
    T, std::void_t<decltype(std::declval<T&>().setVisibleTextSignature(
           0u, std::declval<const PoDoFo::Rect&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<std::string>&>()))>>
    : std::true_type {};

template <typename T, typename = void>
struct HasLegacyVisibleSignatureSetter : std::false_type {};

template <typename T>
struct HasLegacyVisibleSignatureSetter<
    T, std::void_t<decltype(std::declval<T&>().setVisibleSignature(
           0u, std::declval<const PoDoFo::Rect&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<std::string>&>()))>>
    : std::true_type {};

template <typename T, typename = void>
struct HasVisibleImageSignatureSetter : std::false_type {};

template <typename T>
struct HasVisibleImageSignatureSetter<
    T, std::void_t<decltype(std::declval<T&>().setVisibleImageSignature(
           0u, std::declval<const PoDoFo::Rect&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<std::string>&>(),
           std::declval<const std::optional<PoDoFo::charbuff>&>(),
           std::declval<const std::optional<std::string>&>()))>>
    : std::true_type {};

static std::optional<PoDoFo::charbuff> toCharbuff(
    const std::optional<std::shared_ptr<ArrayBuffer>>& data) {
  if (!data || !*data) {
    return std::nullopt;
  }

  PoDoFo::charbuff buffer;
  buffer.assign(reinterpret_cast<const char*>((*data)->data()),
                (*data)->size());
  return buffer;
}

static std::optional<std::string> toImageFit(
    const std::optional<PdfVisibleSignatureImageFit>& fit) {
  if (!fit) {
    return std::nullopt;
  }
  switch (*fit) {
    case PdfVisibleSignatureImageFit::CONTAIN:
      return "contain";
    case PdfVisibleSignatureImageFit::STRETCH:
      return "stretch";
  }
  throw std::invalid_argument("Unknown PdfVisibleSignatureImageFit");
}

template <typename T>
static void validateVisibleSignaturePlacement(const T& options,
                                              const char* optionName) {
  if (options.pageIndex < 0) {
    throw std::invalid_argument(std::string(optionName) +
                                ".pageIndex must be >= 0");
  }
  if (options.width <= 0 || options.height <= 0) {
    throw std::invalid_argument(std::string(optionName) + ".width and " +
                                optionName + ".height must be > 0");
  }
}

template <typename T>
static void setVisibleTextSignature(
    T& session, const PdfVisibleTextSignatureOptions& options) {
  validateVisibleSignaturePlacement(options, "visibleTextSignature");

  if constexpr (HasVisibleTextSignatureSetter<T>::value) {
    session.setVisibleTextSignature(
        static_cast<unsigned>(options.pageIndex),
        PoDoFo::Rect(options.x, options.y, options.width, options.height),
        options.text, options.fontName);
  } else if constexpr (HasLegacyVisibleSignatureSetter<T>::value) {
    session.setVisibleSignature(
        static_cast<unsigned>(options.pageIndex),
        PoDoFo::Rect(options.x, options.y, options.width, options.height),
        options.text, options.fontName);
  } else {
    throw std::runtime_error(
        "visibleTextSignature requires a PoDoFo build that exposes "
        "PdfRemoteSignDocumentSession::setVisibleTextSignature or "
        "PdfRemoteSignDocumentSession::setVisibleSignature");
  }
}

template <typename T>
static void setVisibleImageSignature(
    T& session, const PdfVisibleImageSignatureOptions& options) {
  validateVisibleSignaturePlacement(options, "visibleImageSignature");

  const auto& image = options.image;
  const auto imageSourceCount = static_cast<int>(image.path.has_value()) +
                                static_cast<int>(image.base64.has_value()) +
                                static_cast<int>(image.bytes.has_value());
  if (imageSourceCount != 1) {
    throw std::invalid_argument(
        "visibleImageSignature.image must use exactly one of path, base64, or "
        "bytes");
  }

  if constexpr (HasVisibleImageSignatureSetter<T>::value) {
    session.setVisibleImageSignature(
        static_cast<unsigned>(options.pageIndex),
        PoDoFo::Rect(options.x, options.y, options.width, options.height),
        image.path, image.base64, toCharbuff(image.bytes),
        toImageFit(image.fit));
  } else {
    throw std::runtime_error(
        "visibleImageSignature requires a PoDoFo build that exposes "
        "PdfRemoteSignDocumentSession::setVisibleImageSignature");
  }
}

static void applySignatureMetadata(
    PdfRemoteSignDocumentSession& session,
    const std::optional<std::string>& signerName,
    const std::optional<std::string>& reason,
    const std::optional<std::string>& location,
    const std::optional<std::string>& contactInfo) {
  if (signerName) {
    session.setSignerName(*signerName);
  }
  if (reason) {
    session.setSignatureReason(*reason);
  }
  if (location) {
    session.setSignatureLocation(*location);
  }
  if (contactInfo) {
    session.setSignatureContactInfo(*contactInfo);
  }
}

static void applySignatureOptions(PdfRemoteSignDocumentSession& session,
                                  const PdfSigningSessionOptions& options) {
  if (options.visibleTextSignature && options.visibleImageSignature) {
    throw std::invalid_argument(
        "Use only one of visibleTextSignature or visibleImageSignature");
  }

  if (options.visibleTextSignature) {
    const auto& visibleSignature = *options.visibleTextSignature;
    setVisibleTextSignature(session, visibleSignature);
    applySignatureMetadata(session, visibleSignature.signerName,
                           visibleSignature.reason, visibleSignature.location,
                           visibleSignature.contactInfo);
    return;
  }

  if (options.visibleImageSignature) {
    const auto& visibleSignature = *options.visibleImageSignature;
    setVisibleImageSignature(session, visibleSignature);
    applySignatureMetadata(session, visibleSignature.signerName,
                           visibleSignature.reason, visibleSignature.location,
                           visibleSignature.contactInfo);
  }
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
  applySignatureOptions(*session, options);
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
using CGDataProviderPtr =
    std::unique_ptr<std::remove_pointer_t<CGDataProviderRef>, CFReleaser>;
using CGImagePtr =
    std::unique_ptr<std::remove_pointer_t<CGImageRef>, CFReleaser>;
using CGImageDestinationPtr =
    std::unique_ptr<std::remove_pointer_t<CGImageDestinationRef>, CFReleaser>;

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

static CFStringRef toImageUniformTypeIdentifier(const std::string& format) {
  if (format == "png") {
    return CFSTR("public.png");
  }
  if (format == "jpeg") {
    return CFSTR("public.jpeg");
  }
  throw std::invalid_argument("Unsupported bitmap image format: " + format);
}

std::shared_ptr<Promise<void>> HybridPdfEditor::writeBitmapToImage(
    const PdfPageBitmap& bitmap, const std::string& outputPath,
    const std::string& format) {
  if (bitmap.format != "RGBA8888") {
    throw std::invalid_argument(
        "Only RGBA8888 bitmaps can be encoded as images");
  }

  size_t width = static_cast<size_t>(bitmap.width);
  size_t height = static_cast<size_t>(bitmap.height);
  size_t bytesPerRow = static_cast<size_t>(bitmap.bytesPerRow);
  if (width == 0 || height == 0 || bytesPerRow < width * 4) {
    throw std::invalid_argument("Bitmap has invalid dimensions");
  }
  if (bitmap.data == nullptr || bitmap.data->size() < bytesPerRow * height) {
    throw std::invalid_argument("Bitmap data is smaller than its dimensions");
  }

  auto data = ArrayBuffer::copy(bitmap.data);
  return Promise<void>::async([data, width, height, bytesPerRow, outputPath,
                               format]() {
    if (data == nullptr || data->size() < bytesPerRow * height) {
      throw std::invalid_argument("Bitmap data is smaller than its dimensions");
    }

    CGDataProviderPtr provider(CGDataProviderCreateWithData(
        nullptr, data->data(), data->size(), nullptr));
    if (!provider) {
      throw std::runtime_error("Failed to create image data provider");
    }

    CGColorSpacePtr colorSpace(CGColorSpaceCreateDeviceRGB());
    CGImagePtr image(CGImageCreate(
        width, height, 8, 32, bytesPerRow, colorSpace.get(),
        kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big,
        provider.get(), nullptr, false, kCGRenderingIntentDefault));
    if (!image) {
      throw std::runtime_error("Failed to create image");
    }

    CFURLRef rawUrl = CFURLCreateFromFileSystemRepresentation(
        kCFAllocatorDefault, reinterpret_cast<const UInt8*>(outputPath.c_str()),
        static_cast<CFIndex>(outputPath.size()), false);
    if (rawUrl == nullptr) {
      throw std::runtime_error("Invalid output path: " + outputPath);
    }
    CGImageDestinationPtr destination(CGImageDestinationCreateWithURL(
        rawUrl, toImageUniformTypeIdentifier(format), 1, nullptr));
    CFRelease(rawUrl);
    if (!destination) {
      throw std::runtime_error("Failed to create image destination");
    }

    CGImageDestinationAddImage(destination.get(), image.get(), nullptr);
    if (!CGImageDestinationFinalize(destination.get())) {
      throw std::runtime_error("Failed to write image: " + outputPath);
    }
  });
}

}  // namespace margelo::nitro::pdfeditor
