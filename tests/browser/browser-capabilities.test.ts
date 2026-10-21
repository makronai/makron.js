import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBrowserCapabilities,
  assertBrowserEnvironment,
} from '../../src/browser/browser-capabilities';

test('detectBrowserCapabilities safely runs in Node.js environment returning isBrowser: false', async () => {
  const caps = await detectBrowserCapabilities();
  assert.equal(caps.isBrowser, false);
  assert.equal(caps.hasWebGPU, false);
});

test('assertBrowserEnvironment throws clear descriptive error when called outside browser', () => {
  assert.throws(
    () => {
      assertBrowserEnvironment('TestRuntime');
    },
    /requires a browser environment/
  );
});
