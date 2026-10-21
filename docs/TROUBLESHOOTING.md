# Makron.js Troubleshooting Guide

This guide covers common errors, root causes, and recommended solutions.

---

### 1. `AuthenticationError` (401 / 403)
- **Cause**: Missing or invalid API key.
- **Solution**: Set the environment variable expected by the provider (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`) or pass `apiKey` directly in `createMakron({ apiKey: '...' })`.

---

### 2. `RateLimitError` (429)
- **Cause**: Exceeded provider request or token quota.
- **Solution**: Makron.js automatically retries with exponential backoff and jitter. If the provider includes a `Retry-After` header, Makron waits for the requested duration. You can customize retry behavior via `createMakron({ retries: 4, timeoutMs: 30000 })`.

---

### 3. `UnsupportedCapabilityError`
- **Cause**: Attempting an operation (e.g. `tools`, `vision`, `streaming`, `embeddings`) on a model that does not support it.
- **Solution**: Check `ai.supportsCapability('tools')` before calling. Consult `makron.js/models` catalog to inspect supported capabilities.

---

### 4. `IntegrationDependencyError`
- **Cause**: Invoking an optional adapter (e.g. `@mlc-ai/web-llm`, `@huggingface/transformers`, `@langchain/core`) that is not installed in your project.
- **Solution**: Run `npm install <package-name>`. Makron.js keeps all optional integrations separate from the core package so you only install what you need.

---

### 5. Browser WebGPU Not Available
- **Cause**: User's device, GPU driver, or browser does not support WebGPU.
- **Solution**: Transformers.js automatically falls back to `wasm`. For WebLLM, check `(await detectBrowserCapabilities()).hasWebGPU` and show a friendly upgrade prompt.

---

### 6. Wllama Multi-Threading Warning
- **Cause**: Page is missing cross-origin isolation headers.
- **Solution**: Configure web server headers:
  ```http
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
