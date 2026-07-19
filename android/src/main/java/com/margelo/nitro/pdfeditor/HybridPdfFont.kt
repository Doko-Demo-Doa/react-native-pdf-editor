package com.margelo.nitro.pdfeditor

import com.facebook.proguard.annotations.DoNotStrip
import com.podofo.android.PdfFont as PodofoFont

@DoNotStrip class HybridPdfFont(internal val native: PodofoFont) : HybridPdfFontSpec()
