import type { Adapter } from './types.js';

export function createAnthropicWebSearchAdapter(): Adapter {
  return {
    variant: 'anthropic-web-search',
    toolsForAnthropic() {
      return [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    },
    async invoke() {
      throw new Error(
        'anthropic-web-search is a server-side tool — Anthropic executes it; the runner does not invoke it locally',
      );
    },
    toolsSystemPromptFragment() {
      return 'You have access to web search. Use it to retrieve current information when needed.';
    },
  };
}
