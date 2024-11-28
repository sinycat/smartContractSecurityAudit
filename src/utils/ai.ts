import { useState, useEffect } from "react";
import { getModelById } from "./openai-models";
import { getClaudeModelById } from "./claude-models";
import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk";

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

  console.log(config.selectedModel);
  
  try {
    if (config.provider === "claude") {
      const claudeModel = getClaudeModelById(config.selectedModel);
      if (!claudeModel) {
        throw new Error("Invalid Claude model selected");
      }

      const anthropic = new Anthropic({
        apiKey: config.claudeKey,
        dangerouslyAllowBrowser: true
      });

      const msg = await anthropic.messages.create({
        model: config.selectedModel,
        max_tokens: 8000,
        temperature: 0.7,
        system: "You are a smart contract security expert. Analyze the provided smart contract code and provide a detailed security analysis.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      });

      const content = msg.content[0] as { type: 'text', text: string };
      if (content.type !== 'text') {
        throw new Error("Unexpected response format from Claude");
      }
      return content.text;

    } else if (config.provider === "gpt") {
      const gptModel = getModelById(config.selectedModel);
      if (!gptModel) {
        throw new Error("Invalid GPT model selected");
      }

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

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      throw new Error("Invalid provider");
    }
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error during analysis");
  }
}
