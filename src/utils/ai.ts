import { useState, useEffect } from "react";
import { getModelById, GPT_MODELS } from "./openai-models";
import { getClaudeModelById, CLAUDE_MODELS } from "./claude-models";
import { getGeminiModelById, GEMINI_MODELS } from "./gemini-models";
import Anthropic from "@anthropic-ai/sdk";
import { AIConfig } from "@/types/ai";

// Get AI config from localStorage
export function getAIConfig(config: AIConfig): AIConfig {
  const savedConfig = localStorage.getItem("ai_config");
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return config;
}

// Get AI model name
export function getModelName(config: AIConfig): string {
  if (config.provider === "claude") {
    const model = getClaudeModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "claude";
  } else if (config.provider === "gemini") {
    const model = getGeminiModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "gemini";
  } else if (config.provider === "gpt") {
    const model = getModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "gpt";
  }
  return "";
}

// AI configuration Hook
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Read configuration from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_config");
      if (saved) {
        const savedConfig = JSON.parse(saved);
        // Validate if saved model is valid
        if (savedConfig.provider === "gpt") {
          const validModel = GPT_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = GPT_MODELS[0].id;
          }
        } else if (savedConfig.provider === "claude") {
          const validModel = CLAUDE_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = CLAUDE_MODELS[0].id;
          }
        } else if (savedConfig.provider === "gemini") {
          const validModel = GEMINI_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = GEMINI_MODELS[0].id;
          }
        }
        return savedConfig;
      }
    }
    return {
      provider: "gpt",
      gptKey: "",
      claudeKey: "",
      geminiKey: "",
      selectedModel: GPT_MODELS[0].id,
      language: "english",
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
    if (config.provider === "gemini") {
      const geminiModel = getGeminiModelById(config.selectedModel);
      if (!geminiModel) {
        throw new Error(
          `Invalid Gemini model selected: ${config.selectedModel}`
        );
      }

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel.id}:generateContent?key=${config.geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `Gemini API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } else if (config.provider === "claude") {
      const claudeModel = getClaudeModelById(config.selectedModel);
      if (!claudeModel) {
        throw new Error("Invalid Claude model selected");
      }

      const anthropic = new Anthropic({
        apiKey: config.claudeKey,
        dangerouslyAllowBrowser: true,
      });

      const msg = await anthropic.messages.create({
        model: config.selectedModel,
        max_tokens: 8000,
        temperature: 1,
        system: `You are a smart contract security auditor with the following responsibilities:
- Identify potential security vulnerabilities and risks
- Analyze code for best practices and standards compliance
- Suggest gas optimizations and efficiency improvements
- Provide detailed explanations of findings
- Recommend specific fixes and improvements
Format your response with clear sections for vulnerabilities, optimizations, and recommendations.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      if (!msg.content[0] || !("text" in msg.content[0])) {
        throw new Error("Unexpected response format from Claude");
      }
      return msg.content[0].text;
    } else if (config.provider === "gpt") {
      const gptModel = getModelById(config.selectedModel);
      if (!gptModel) {
        throw new Error(`Invalid GPT model selected: ${config.selectedModel}`);
      }

      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.gptKey}`,
        },
        body: JSON.stringify({
          model: gptModel.id,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          ...(gptModel.supportsTemperature !== false
            ? { temperature: 0.7 }
            : {}),
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
