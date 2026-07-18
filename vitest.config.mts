import { configDefaults, defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

export default defineConfig({
  plugins: [reactNative()],
  test: {
    exclude: [...configDefaults.exclude, 'example/**', 'lib/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
