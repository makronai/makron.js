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
export declare function detectBrowserCapabilities(): Promise<BrowserEnvironmentCapabilities>;
export declare function assertBrowserEnvironment(runtimeName: string): void;
