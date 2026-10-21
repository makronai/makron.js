/**
 * @license MIT
 * Makron.js Environment Variable Resolution
 */

/**
 * Safely retrieves an environment variable without crashing in browser environments.
 */
export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key] !== undefined && process.env[key] !== '') {
      return process.env[key];
    }
  }

  // Support Vite client-side variables (e.g. VITE_OPENAI_API_KEY)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv[key]) return metaEnv[key];
    if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
  }

  // Support browser window variables if configured safely
  if (typeof window !== 'undefined' && (window as any).__MAKRON_ENV__) {
    return (window as any).__MAKRON_ENV__[key];
  }

  return undefined;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isNode(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}
