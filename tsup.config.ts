import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'providers/index': 'src/providers/index.ts',
    'browser/index': 'src/browser/index.ts',
    'models/index': 'src/models/index.ts',
    'integrations/index': 'src/integrations/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  clean: false, // Don't wipe dist directory
  outDir: 'dist-package',
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: [
    '@huggingface/transformers',
    '@mlc-ai/web-llm',
    '@wllama/wllama',
    'onnxruntime-web',
    '@langchain/core',
    'llamaindex',
  ],
});
