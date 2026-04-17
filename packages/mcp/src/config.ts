export interface McpConfig {
  apiKey: string;
  baseUrl?: string;
}

export function loadConfig(): McpConfig {
  const apiKey = process.env.JINTEL_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'JINTEL_API_KEY environment variable is required. Obtain a key at https://api.jintel.ai and set it before starting the MCP server.',
    );
  }
  const baseUrl = process.env.JINTEL_BASE_URL?.trim();
  return {
    apiKey: apiKey.trim(),
    baseUrl: baseUrl && baseUrl.length > 0 ? baseUrl : undefined,
  };
}
