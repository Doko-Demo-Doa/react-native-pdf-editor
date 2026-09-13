const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const POD_OVERRIDE =
  "pod 'YubiKit', :git => 'https://github.com/Yubico/yubikit-ios.git', :tag => '4.7.0'";

module.exports = function withYubiKitPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile'
      );
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (!contents.includes(POD_OVERRIDE)) {
        contents = contents.replace(
          /(use_expo_modules!\n)/,
          `$1\n  ${POD_OVERRIDE}\n`
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return cfg;
    },
  ]);
};
