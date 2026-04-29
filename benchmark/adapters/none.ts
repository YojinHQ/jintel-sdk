import type { Adapter } from './types.js';

export function createNoneAdapter(): Adapter {
  return {
    variant: 'bare',
    toolsForAnthropic() {
      return [];
    },
    async invoke() {
      throw new Error('No tools available — bare adapter cannot invoke tools');
    },
    toolsSystemPromptFragment() {
      return 'You have no tools available. Answer from your training knowledge only.';
    },
  };
}
