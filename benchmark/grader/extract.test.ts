import { describe, it, expect } from 'vitest';
import { extract } from './extract.js';
import type { TranscriptTurn } from '../types.js';

describe('extract', () => {
  it('answer-tag: extracts content of <answer> tag from last assistant turn', () => {
    const transcript: TranscriptTurn[] = [{ role: 'assistant', content: 'Thinking... <answer>2.91</answer>' }];
    const result = extract(transcript);
    expect(result.value).toBe('2.91');
    expect(result.path).toBe('answer-tag');
  });

  it('answer-tag: extracts when content is array of text blocks', () => {
    const transcript: TranscriptTurn[] = [
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'My answer is <answer>$8.70</answer>.' }],
      },
    ];
    const result = extract(transcript);
    expect(result.value).toBe('$8.70');
    expect(result.path).toBe('answer-tag');
  });

  it('last-assistant-message: falls back when no answer tag', () => {
    const transcript: TranscriptTurn[] = [{ role: 'assistant', content: 'The price is 100.5' }];
    const result = extract(transcript);
    expect(result.value).toBe('The price is 100.5');
    expect(result.path).toBe('last-assistant-message');
  });

  it('last-assistant-message: picks the LAST assistant message', () => {
    const transcript: TranscriptTurn[] = [
      { role: 'assistant', content: 'first' },
      { role: 'user', content: 'continue' },
      { role: 'assistant', content: 'final' },
    ];
    const result = extract(transcript);
    expect(result.value).toBe('final');
  });

  it('failed: returns failed when no assistant turns', () => {
    const transcript: TranscriptTurn[] = [{ role: 'user', content: 'hello' }];
    const result = extract(transcript);
    expect(result.path).toBe('failed');
    expect(result.value).toBeNull();
  });

  it('answer-tag: empty <answer></answer> falls through to last-assistant-message', () => {
    const transcript: TranscriptTurn[] = [
      { role: 'assistant', content: 'I do not know. <answer></answer>' },
    ];
    const result = extract(transcript);
    expect(result.value).toBe('I do not know. <answer></answer>');
    expect(result.path).toBe('last-assistant-message');
  });

  it('answer-tag: whitespace-only <answer>   </answer> falls through', () => {
    const transcript: TranscriptTurn[] = [{ role: 'assistant', content: 'foo <answer>   </answer>' }];
    const result = extract(transcript);
    expect(result.path).toBe('last-assistant-message');
  });

  it('answer-tag: with multiple tags, last non-empty wins', () => {
    const transcript: TranscriptTurn[] = [
      { role: 'assistant', content: '<answer>first</answer> wait, <answer>final</answer>' },
    ];
    const result = extract(transcript);
    expect(result.value).toBe('final');
    expect(result.path).toBe('answer-tag');
  });

  it('answer-tag: skips empty tags to find last non-empty', () => {
    const transcript: TranscriptTurn[] = [
      { role: 'assistant', content: '<answer>real</answer> <answer></answer>' },
    ];
    const result = extract(transcript);
    expect(result.value).toBe('real');
    expect(result.path).toBe('answer-tag');
  });
});
