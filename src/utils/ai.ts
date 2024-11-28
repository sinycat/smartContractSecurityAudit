import { useState, useEffect } from 'react';

interface AIConfig {
  provider: 'gpt35' | 'gpt4' | 'claude';
  apiKey: string;
}

// AI configuration Hook  
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Read configuration from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_config');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { provider: 'claude', apiKey: '' };
  });

  // Save configuration to localStorage
  useEffect(() => {
    localStorage.setItem('ai_config', JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}

// AI analysis function
export async function analyzeWithAI(prompt: string): Promise<string> {
  // Get configuration from localStorage
  const savedConfig = localStorage.getItem('ai_config');
  if (!savedConfig) {
    throw new Error('AI configuration not found');
  }

  const config: AIConfig = JSON.parse(savedConfig);
  
  try {
    let response;
    
    if (config.provider === 'claude') {
      // Anthropic Claude API
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });
    } else {
      // OpenAI API
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.provider === 'gpt4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7
        })
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (config.provider === 'claude') {
      return data.content[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
} 