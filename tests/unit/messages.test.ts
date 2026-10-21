import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMessages,
  contentToString,
  extractSystemPrompt,
} from '../../src/index';

test('contentToString extracts plain text from strings and multimodal parts', () => {
  assert.equal(contentToString('simple text'), 'simple text');
  assert.equal(
    contentToString([
      { type: 'text', text: 'part 1' },
      { type: 'text', text: 'part 2' },
    ]),
    'part 1\npart 2'
  );
});

test('extractSystemPrompt separates system instruction from conversation messages', () => {
  const { systemPrompt, conversationMessages } = extractSystemPrompt([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello' },
  ]);

  assert.equal(systemPrompt, 'You are a helpful assistant.');
  assert.equal(conversationMessages.length, 1);
  assert.equal(conversationMessages[0].role, 'user');
});

test('normalizeMessages converts roles and attributes cleanly', () => {
  const normalized = normalizeMessages([
    { role: 'USER', content: 'Hi' },
    { role: 'ASSISTANT', content: 'Hello' },
  ]);

  assert.equal(normalized[0].role, 'user');
  assert.equal(normalized[1].role, 'assistant');
});
