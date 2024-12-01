export interface AIConfig {
  provider: 'gpt' | 'claude' | 'gemini' | 'xai';
  gptKey: string;
  claudeKey: string;
  geminiKey: string;
  xaiKey: string;
  selectedModel: string;
  language: string;
  superPrompt: boolean;
}
