# Makron.js Security Policy & Best Practices

## 1. Zero Secrets in Output and Errors

Makron.js incorporates automatic secret and API key redaction:
- Authorization headers (`Bearer [REDACTED]`)
- Provider API keys (`sk-...[REDACTED]`, `AIza...`, `gsk_...`, `hf_...`)
- Log entries and error stack traces
- User-configured base URL query credentials

## 2. Server-Side vs Client-Side Execution

- **Hosted API Keys**: Never embed privileged API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) in frontend client-side bundles. Always proxy requests through your server or serverless functions (`/api/*`).
- **Browser-Native Inference**: When running models via `makron.js/browser` (Transformers.js, WebLLM, Wllama), inference executes 100% locally on the user's hardware. Prompts and completions never leave the browser. Model downloads still contact Hugging Face / CDN hosts unless self-hosted.

## 3. Tool Execution Authorization

Makron.js does **not** execute arbitrary code or model-generated tool calls automatically. Tool execution requires explicit developer definitions through `defineTool()` and invocation through `executeToolCalls()`.

## 4. SSRF and Base URL Validation

All user-configured base URLs are validated to enforce `http` or `https` protocols and prevent unintended internal network requests.
