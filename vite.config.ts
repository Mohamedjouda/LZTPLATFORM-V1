import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Explicitly import `cwd` from 'process' to resolve a TypeScript type
// conflict with the global `process` object.
import { cwd } from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose environment variables to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      // By default, Vite empties the outDir on build.
      // We are disabling this behavior because your hosting panel (aaPanel)
      // may place a protected `.user.ini` file in the output directory (`dist`).
      // This protected file causes the build to fail when Vite tries to delete it.
      // By setting `emptyOutDir` to `false`, Vite will build without trying to
      // clear the directory first, successfully working around the permission error.
      emptyOutDir: false,
    },
  };
});
