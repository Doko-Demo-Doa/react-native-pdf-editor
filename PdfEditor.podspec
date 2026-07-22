require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

podofo_version = "0.0.14"
podofo_url     = "https://github.com/Doko-Demo-Doa/podofo/releases/download/v#{podofo_version}/PoDoFo-#{podofo_version}.xcframework.zip"
podofo_sha256  = "caba1d5805898223528940ab4711593258e491d88a9088a2b0473057c074ae39"
podofo_dir     = "ios/Frameworks"

Pod::Spec.new do |s|
  s.name         = "PdfEditor"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/Doko-Demo-Doa/react-native-pdf-editor.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.prepare_command = <<-CMD
    set -e
    mkdir -p "#{podofo_dir}"
    if [ ! -d "#{podofo_dir}/PoDoFo.xcframework" ]; then
      curl -fsSL -o "#{podofo_dir}/PoDoFo.xcframework.zip" "#{podofo_url}"
      echo "#{podofo_sha256}  #{podofo_dir}/PoDoFo.xcframework.zip" | shasum -a 256 -c -
      unzip -o -q "#{podofo_dir}/PoDoFo.xcframework.zip" -d "#{podofo_dir}"
      rm "#{podofo_dir}/PoDoFo.xcframework.zip"
      # The published xcframework's static libraries are named "PoDoFo.a",
      # but Xcode links vendored static-library xcframeworks via `-lPoDoFo`,
      # which only resolves a "lib"-prefixed file. Rename each slice's
      # binary and update Info.plist to match, or the linker fails with
      # "library 'PoDoFo' not found".
      find "#{podofo_dir}/PoDoFo.xcframework" -name "PoDoFo.a" -exec sh -c 'mv "$1" "$(dirname "$1")/libPoDoFo.a"' _ {} \\;
      sed -i '' 's/PoDoFo\\.a/libPoDoFo.a/g' "#{podofo_dir}/PoDoFo.xcframework/Info.plist"
    fi
  CMD

  s.vendored_frameworks = "#{podofo_dir}/PoDoFo.xcframework"

  # For page-to-bitmap rendering (PdfEditor::renderPageToBitmap) — PoDoFo
  # doesn't rasterize, so that uses Core Graphics directly.
  s.frameworks = "CoreGraphics", "ImageIO"

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/PdfEditor+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
