export interface AIConfig {
  provider: "gpt" | "claude";
  gptKey: string;
  claudeKey: string;
  selectedModel: string;
  language: string;
} 