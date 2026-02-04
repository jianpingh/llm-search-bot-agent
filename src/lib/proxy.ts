// Global proxy initialization for OpenAI API access in China
// This must be imported before any HTTP requests are made

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

if (proxyUrl && typeof globalThis !== 'undefined') {
  // Set global agent environment variables
  process.env.GLOBAL_AGENT_HTTP_PROXY = proxyUrl;
  process.env.GLOBAL_AGENT_HTTPS_PROXY = proxyUrl;
  process.env.GLOBAL_AGENT_NO_PROXY = 'localhost,127.0.0.1';
  
  // Bootstrap global-agent
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('global-agent').bootstrap();
  
  console.log(`[Proxy] Global proxy initialized: ${proxyUrl}`);
}

export {};
