import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // By default, Vite empties the outDir on build.
    // We are disabling this behavior because your hosting panel (aaPanel)
    // may place a protected `.user.ini` file in the output directory (`dist`).
    // This protected file causes the build to fail when Vite tries to delete it.
    // By setting `emptyOutDir` to `false`, Vite will build without trying to
    // clear the directory first, successfully working around the permission error.
    emptyOutDir: false,
  },
});
