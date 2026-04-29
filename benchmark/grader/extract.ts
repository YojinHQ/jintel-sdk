import type { TranscriptTurn, ExtractionPath } from '../types.js';

export interface ExtractResult {
  value: string | null;
  path: ExtractionPath;
}

const ANSWER_TAG_RE = /<answer>([\s\S]*?)<\/answer>/gi;

function turnToText(turn: TranscriptTurn): string {
  if (typeof turn.content === 'string') return turn.content;
  if (Array.isArray(turn.content)) {
    return turn.content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'type' in block && (block as { type: string }).type === 'text') {
          return (block as { text: string }).text;
        }
        return '';
      })
      .join('\n');
  }
  return '';
}

export function extract(transcript: TranscriptTurn[]): ExtractResult {
  const assistantTurns = transcript.filter((t) => t.role === 'assistant');
  if (assistantTurns.length === 0) {
    return { value: null, path: 'failed' };
  }
  const last = assistantTurns[assistantTurns.length - 1];
  const text = turnToText(last);

  // If the model emits multiple <answer> blocks, the last one is the corrected/final answer.
  // Empty tags (<answer></answer>) fall through to the message-text fallback rather than
  // returning "" — otherwise numeric_tolerance would silently grade 0 against expected.
  const tagMatches = [...text.matchAll(ANSWER_TAG_RE)];
  for (let i = tagMatches.length - 1; i >= 0; i--) {
    const inner = tagMatches[i][1].trim();
    if (inner.length > 0) {
      return { value: inner, path: 'answer-tag' };
    }
  }

  if (text.trim().length > 0) {
    return { value: text.trim(), path: 'last-assistant-message' };
  }

  return { value: null, path: 'failed' };
}
