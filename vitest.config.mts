import { reactNative } from 'vitest-native';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactNative()],
  test: {
    exclude: [...configDefaults.exclude, 'example/**', 'lib/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
