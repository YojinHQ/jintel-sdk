import type Anthropic from '@anthropic-ai/sdk';

import type { VariantId } from '../types.js';

export interface AnthropicClientToolDef {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export type AnthropicToolDef = Anthropic.Messages.ToolUnion;

export interface ToolInvocation {
  name: string;
  input: unknown;
}

export interface ToolInvocationResult {
  content: unknown;
  is_error: boolean;
  latency_ms: number;
}

export interface Adapter {
  variant: VariantId;
  toolsForAnthropic(): AnthropicToolDef[];
  invoke(call: ToolInvocation): Promise<ToolInvocationResult>;
  toolsSystemPromptFragment(): string;
  close?(): Promise<void>;
}
