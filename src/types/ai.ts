export interface AIConfig {
  provider: "gpt" | "claude" | "gemini";
  gptKey: string;
  claudeKey: string;
  geminiKey: string;
  selectedModel: string;
  language: string;
}
