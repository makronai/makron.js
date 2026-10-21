import test from 'node:test';
import assert from 'node:assert/strict';
import {
  supportsCapability,
  assertCapability,
  UnsupportedCapabilityError,
  createCapabilities,
} from '../../src/index';

test('supportsCapability detects capability flags accurately', () => {
  const caps = createCapabilities({
    chat: true,
    streaming: true,
    tools: true,
    vision: false,
  });

  assert.equal(supportsCapability(caps, 'chat'), true);
  assert.equal(supportsCapability(caps, 'tools'), true);
  assert.equal(supportsCapability(caps, 'vision'), false);
  assert.equal(supportsCapability(caps, 'embeddings'), false);
});

test('assertCapability throws UnsupportedCapabilityError when capability missing', () => {
  const caps = createCapabilities({ tools: false });

  assert.throws(
    () => {
      assertCapability(caps, 'tools', 'compact-model');
    },
    (err: any) => err instanceof UnsupportedCapabilityError && err.capability === 'tools'
  );
});
