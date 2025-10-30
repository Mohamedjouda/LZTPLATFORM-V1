import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Explicitly import `cwd` from 'process' to resolve a TypeScript type
// conflict with the global `process` object.
import { cwd } from 'process';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose environment variables to the client-side code that are NOT prefixed with VITE_.
      // This is necessary for variables like API_KEY which are expected on `process.env`.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Directly replace `import.meta.env.VITE_APP_VERSION` with the version from package.json at build time.
      // This is a robust method to avoid runtime errors if `import.meta.env` is not populated as expected.
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    },
    build: {
      // By default, Vite empties the outDir on build.
      // We are disabling this behavior because your hosting panel (aaPanel)
      // may place a protected `.user.ini` file in the output directory (`dist`).
      // This protected file causes the build to fail when Vite tries to delete it.
      // By setting `emptyOutDir` to `false`, Vite will build without trying to
      // clear the directory first, successfully working around the permission error.
      emptyOutDir: false,
      rollupOptions: {
        // Externalize peer dependencies that are provided via the import map in index.html.
        // This prevents the build from failing when it can't find these packages in node_modules.
        external: ['@google/genai'],
      },
    },
  };
});