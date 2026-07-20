package com.margelo.nitro.pdfeditor

import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import com.podofo.android.PdfDocument as PodofoDocument
import com.podofo.android.PoDoFoWrapper as PodofoSigningWrapper
import java.io.File
import java.io.FileOutputStream
import kotlin.math.ceil

/**
 * The autolinked entry point HybridObject — a factory for PdfDocument instances. Kept intentionally
 * tiny: all real document logic lives in HybridPdfDocument, which wraps the published
 * podofo-android JNI wrapper's com.podofo.android.PdfDocument (see PLAN.md §2 — there is no way to
 * link PoDoFo's C++ core directly from a separate Android native module today).
 */
@DoNotStrip
class PdfEditor : HybridPdfEditorSpec() {
  override fun createDocument(): HybridPdfDocumentSpec {
    return HybridPdfDocument(PodofoDocument.createNew())
  }

  override fun openDocument(path: String, password: String?): Promise<HybridPdfDocumentSpec> {
    return Promise.parallel<HybridPdfDocumentSpec> {
      HybridPdfDocument(PodofoDocument.load(path, password))
    }
  }

  override fun isEncrypted(path: String): Promise<Boolean> {
    return Promise.parallel<Boolean> {
      PodofoDocument.isEncrypted(path)
    }
  }

  override fun createSigningSession(
    options: PdfSigningSessionOptions
  ): HybridPdfSigningSessionSpec {
    // com.podofo.android.PoDoFoWrapper's constructor has no root-certificate
    // parameter at all — its native init hardcodes std::nullopt for it
    // (confirmed in src/wrapper/podofo_jni.cpp). Rather than silently
    // dropping a caller-supplied root cert (an unnoticed trust-chain gap),
    // fail loudly until the Android wrapper gains this parameter upstream.
    if (options.rootCertificate != null) {
      throw UnsupportedOperationException(
        "rootCertificate is not supported on Android yet — the published podofo-android JNI wrapper's " +
          "PoDoFoWrapper has no root-certificate parameter (see PLAN.md open questions)."
      )
    }
    val wrapper =
      PodofoSigningWrapper(
        options.conformanceLevel.toPodofoName(),
        options.hashAlgorithm.toPodofoOid(),
        options.inputPath,
        options.outputPath,
        options.endCertificate,
        options.certificateChain,
      )
    return HybridPdfSigningSession(wrapper)
  }

  override fun renderPageToBitmap(options: RenderPageOptions): Promise<PdfPageBitmap> {
    return Promise.parallel<PdfPageBitmap> {
      val scale = options.scale ?: 1.0
      require(scale > 0) { "scale must be > 0" }
      val pageIndex = options.pageIndex.toInt()

      ParcelFileDescriptor.open(File(options.path), ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
        PdfRenderer(fd).use { renderer ->
          require(pageIndex in 0 until renderer.pageCount) { "Page index out of range: $pageIndex" }

          renderer.openPage(pageIndex).use { page ->
            // Unlike iOS's CGPDFPage, PdfRenderer.Page.width/height already
            // reflect the page's rotation — no manual swap needed here.
            val width = ceil(page.width * scale).toInt()
            val height = ceil(page.height * scale).toInt()
            check(width > 0 && height > 0) { "Page has invalid dimensions" }

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            bitmap.eraseColor(android.graphics.Color.WHITE)
            val matrix = Matrix().apply { setScale(scale.toFloat(), scale.toFloat()) }
            page.render(bitmap, null, matrix, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

            val bytesPerRow = bitmap.rowBytes
            val buffer = ArrayBuffer.allocate(bytesPerRow * height)
            bitmap.copyPixelsToBuffer(buffer.getBuffer(false))
            bitmap.recycle()

            PdfPageBitmap(
              buffer,
              width.toDouble(),
              height.toDouble(),
              bytesPerRow.toDouble(),
              "RGBA8888",
            )
          }
        }
      }
    }
  }

  override fun writeBitmapToImage(
    bitmap: PdfPageBitmap,
    outputPath: String,
    format: String,
  ): Promise<Unit> {
    return Promise.parallel<Unit> {
      require(bitmap.format == "RGBA8888") { "Only RGBA8888 bitmaps can be encoded as images" }

      val width = bitmap.width.toInt()
      val height = bitmap.height.toInt()
      require(width > 0 && height > 0) { "Bitmap has invalid dimensions" }

      val nativeBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      require(bitmap.bytesPerRow.toInt() == nativeBitmap.rowBytes) {
        "Bitmap row stride is not supported on Android image encoding"
      }
      nativeBitmap.copyPixelsFromBuffer(bitmap.data.getBuffer(false))
      try {
        val outputFile = File(outputPath)
        outputFile.parentFile?.mkdirs()
        FileOutputStream(outputFile).use { stream ->
          val compressFormat =
            when (format) {
              "png" -> Bitmap.CompressFormat.PNG
              "jpeg" -> Bitmap.CompressFormat.JPEG
              else -> throw IllegalArgumentException("Unsupported bitmap image format: $format")
            }
          check(nativeBitmap.compress(compressFormat, 100, stream)) {
            "Failed to encode image"
          }
        }
      } finally {
        nativeBitmap.recycle()
      }
    }
  }
}
