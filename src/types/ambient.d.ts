/**
 * @license MIT
 * Ambient type declarations for optional peer dependencies
 */

declare module '@huggingface/transformers' {
  export const pipeline: any;
}

declare module '@mlc-ai/web-llm' {
  export const CreateMLCEngine: any;
}

declare module '@wllama/wllama' {
  export const Wllama: any;
}

declare module 'onnxruntime-web' {
  export const InferenceSession: any;
  export const Tensor: any;
}

declare module '@langchain/core' {
  export const BaseChatModel: any;
}

declare module 'llamaindex' {
  export const LLM: any;
}
