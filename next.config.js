/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@langchain/core', '@langchain/langgraph', '@langchain/openai']
  }
};

module.exports = nextConfig;
