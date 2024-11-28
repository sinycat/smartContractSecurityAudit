import { useState, useEffect } from "react";

interface AIConfig {
  provider: "gpt" | "claude";
  gptKey: string;
  claudeKey: string;
  selectedModel: string;
}

// AI configuration Hook
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Read configuration from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_config");
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      provider: "gpt",
      gptKey: "",
      claudeKey: "",
      selectedModel: "gpt-4o-mini",
    };
  });

  // Save configuration to localStorage
  useEffect(() => {
    localStorage.setItem("ai_config", JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}

// AI analysis function
export async function analyzeWithAI(prompt: string): Promise<string> {
  const savedConfig = localStorage.getItem("ai_config");
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }

  const config: AIConfig = JSON.parse(savedConfig);
  let response: Response;

  try {
    if (config.provider === "claude") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.claudeKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });
    } else if (config.provider === "gpt") {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.gptKey}`,
        },
        body: JSON.stringify({
          model: config.selectedModel,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });
    } else {
      throw new Error("Invalid provider");
    }

    if (!response?.ok) {
      const errorData = await response.text();
      throw new Error(
        `API request failed: ${response.statusText}. Details: ${errorData}`
      );
    }

    const data = await response.json();
    return config.provider === "claude"
      ? data.content[0].text
      : data.choices[0].message.content;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error during analysis");
  }
}
