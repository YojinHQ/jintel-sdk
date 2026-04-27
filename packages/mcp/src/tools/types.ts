export const BUNDLE_NAMES = [
  'core',
  'markets',
  'ownership',
  'corporate',
  'regulatory',
  'macro',
  'qualitative',
  'enrich',
] as const;

export type BundleName = (typeof BUNDLE_NAMES)[number];

export const DOMAIN_BUNDLE_NAMES: ReadonlyArray<Exclude<BundleName, 'core'>> = BUNDLE_NAMES.filter(
  (n): n is Exclude<BundleName, 'core'> => n !== 'core',
);

export interface ToolContent {
  type: 'text';
  text: string;
}

export interface ToolCallResult {
  content: ToolContent[];
  isError?: boolean;
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  bundle: BundleName;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<ToolCallResult>;
}
