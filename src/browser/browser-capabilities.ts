/**
 * @license MIT
 * Makron.js Browser Capability & WebGPU Detection
 */

export interface BrowserEnvironmentCapabilities {
  isBrowser: boolean;
  hasWebGPU: boolean;
  hasWasm: boolean;
  hasSharedArrayBuffer: boolean;
  isCrossOriginIsolated: boolean;
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
}

/**
 * Detects current browser runtime capabilities for local client-side inference.
 */
export async function detectBrowserCapabilities(): Promise<BrowserEnvironmentCapabilities> {
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  if (!isBrowser) {
    return {
      isBrowser: false,
      hasWebGPU: false,
      hasWasm: false,
      hasSharedArrayBuffer: false,
      isCrossOriginIsolated: false,
    };
  }

  let hasWebGPU = false;
  if ('gpu' in navigator && (navigator as any).gpu) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      hasWebGPU = Boolean(adapter);
    } catch {
      hasWebGPU = false;
    }
  }

  const hasWasm = typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiate === 'function';
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const isCrossOriginIsolated = typeof window !== 'undefined' && Boolean(window.crossOriginIsolated);
  const deviceMemoryGB = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  return {
    isBrowser: true,
    hasWebGPU,
    hasWasm,
    hasSharedArrayBuffer,
    isCrossOriginIsolated,
    deviceMemoryGB,
    hardwareConcurrency,
  };
}

export function assertBrowserEnvironment(runtimeName: string): void {
  if (typeof window === 'undefined') {
    throw new Error(
      `Runtime '${runtimeName}' requires a browser environment with DOM and window access.`
    );
  }
}
