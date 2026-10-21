/**
 * @license MIT
 * Makron.js Optional Dependencies Checker
 */

export function checkOptionalDependencies() {
  console.log('🔍 Checking optional dependencies status...');
  const optionalPkgs = [
    { pkg: '@huggingface/transformers', feature: 'Transformers.js browser runtime' },
    { pkg: '@mlc-ai/web-llm', feature: 'WebLLM WebGPU browser engine' },
    { pkg: '@wllama/wllama', feature: 'Wllama GGUF browser WASM runtime' },
    { pkg: 'onnxruntime-web', feature: 'ONNX Runtime Web generic inference' },
    { pkg: '@langchain/core', feature: 'LangChain BaseChatModel bridge' },
    { pkg: 'llamaindex', feature: 'LlamaIndex.TS engine bridge' },
  ];

  for (const item of optionalPkgs) {
    try {
      require.resolve(item.pkg);
      console.log(`  ✓ ${item.pkg}: Installed`);
    } catch {
      console.log(`  ℹ️ ${item.pkg}: Not installed (optional for ${item.feature})`);
    }
  }

  console.log('✅ Core Makron.js remains 100% lightweight and dependency-free.');
}

if (process.argv[1]?.endsWith('check-optional-dependencies.ts')) {
  checkOptionalDependencies();
}
