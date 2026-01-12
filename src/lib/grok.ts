import OpenAI from 'openai';

// Initialize Grok (xAI) client
// Using base_url 'https://api.x.ai/v1' as requested
export const grok = new OpenAI({
    apiKey: process.env.XAI_API_KEY || 'dummy_key', // Fallback for build time
    baseURL: 'https://api.x.ai/v1',
});

export const GROK_MODEL = 'grok-4-1-fast-reasoning'; // Preferred model
