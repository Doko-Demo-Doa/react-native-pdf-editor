require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

podofo_version = "0.0.4"
podofo_url     = "https://github.com/Doko-Demo-Doa/podofo/releases/download/v#{podofo_version}/PoDoFo-#{podofo_version}.xcframework.zip"
podofo_sha256  = "88ea5f5d55bc8c0ba4200cc088d6037ff9d352c5e57d1f97d3155131ea664d5a"
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
    fi
  CMD

  s.vendored_frameworks = "#{podofo_dir}/PoDoFo.xcframework"

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/PdfEditor+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
