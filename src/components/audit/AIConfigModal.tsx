import { useState, useEffect } from "react";
import { useAIConfig } from "@/utils/ai";
import { GPT_MODELS, OpenAIModel } from "@/utils/openai-models";
import { CLAUDE_MODELS, ClaudeModel } from "@/utils/claude-models";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
}

export default function AIConfigModal({
  isOpen,
  onClose,
  onStartAnalysis,
}: AIConfigModalProps) {
  const { config, setConfig } = useAIConfig();
  
  // Ensure default model is selected when component mounts
  useEffect(() => {
    if (!config.selectedModel) {
      setConfig(prev => {
        const newConfig = { ...prev };
        if (prev.provider === "claude") {
          newConfig.selectedModel = CLAUDE_MODELS[0].id;
        } else {
          newConfig.selectedModel = GPT_MODELS[0].id;
        }
        return newConfig;
      });
    }
  }, [config.provider]);

  // Handle provider change and select default model
  const handleProviderChange = (provider: "gpt" | "claude") => {
    setConfig(prev => {
      const newConfig = { ...prev, provider };
      
      // Select default model based on provider
      if (provider === "claude") {
        newConfig.selectedModel = CLAUDE_MODELS[0].id;
      } else {
        newConfig.selectedModel = GPT_MODELS[0].id;
      }
      
      return newConfig;
    });
  };

  const handleStartAnalysis = () => {
    const currentKey = config.provider === "claude" ? config.claudeKey : config.gptKey;
    
    if (!currentKey.trim()) {
      toast.error(`Please enter your ${config.provider === "claude" ? "Claude" : "OpenAI"} API key`);
      return;
    }
    
    onStartAnalysis();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-[#1E1E1E] rounded-lg border border-[#333333] p-6 w-[480px] z-50">
        <h3 className="text-xl font-semibold text-white mb-4">AI Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value as "gpt" | "claude")}
              className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
            >
              <option value="gpt">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <select
              value={config.selectedModel}
              onChange={(e) => setConfig({ ...config, selectedModel: e.target.value })}
              className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
            >
              {config.provider === "claude"
                ? CLAUDE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))
                : GPT_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {config.provider === "claude" ? "Claude API Key" : "OpenAI API Key"}
            </label>
            <input
              type="password"
              value={config.provider === "claude" ? config.claudeKey : config.gptKey}
              onChange={(e) => 
                setConfig({
                  ...config,
                  claudeKey: config.provider === "claude" ? e.target.value : config.claudeKey,
                  gptKey: config.provider === "gpt" ? e.target.value : config.gptKey,
                })
              }
              placeholder={`Enter your ${config.provider === "claude" ? "Claude" : "OpenAI"} API key`}
              className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
            />
            <div className="mt-2 text-sm text-gray-400">
              {config.provider === "claude" ? (
                <p>
                  Need a Claude API key?{" "}
                  <a
                    href="https://console.anthropic.com/account/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF8B3E] hover:text-[#FF8B3E]/80 transition-colors"
                  >
                    Get one from Anthropic Console
                  </a>
                  {" "}(requires registration)
                </p>
              ) : (
                <p>
                  Need an OpenAI API key?{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF8B3E] hover:text-[#FF8B3E]/80 transition-colors"
                  >
                    Get one from OpenAI Platform
                  </a>
                  {" "}(requires registration)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              localStorage.removeItem("ai_config");
              setConfig({
                provider: "gpt",
                gptKey: "",
                claudeKey: "",
                selectedModel: GPT_MODELS[0].id,
              });
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAnalysis}
            className="group relative inline-flex items-center gap-2 px-4 py-2 
                     bg-[#252526] rounded-lg text-[#FF8B3E] font-medium
                     border border-[#FF8B3E]/20
                     transition-all duration-300 ease-out
                     hover:bg-[#FF8B3E]/10"
          >
            <span className="relative z-10">Start Analysis</span>
            <svg 
              className="w-4 h-4 transform transition-transform duration-300 
                         group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </Dialog>
  );
} 