import { useState, useEffect } from "react";
import { useAIConfig } from "@/utils/ai";
import { GPT_MODELS } from "@/utils/openai-models";
import { CLAUDE_MODELS } from "@/utils/claude-models";
import { GEMINI_MODELS } from "@/utils/gemini-models";
import { Dialog, Listbox } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { AIConfig } from "@/types/ai";
import { RESPONSE_LANGUAGES } from "@/utils/language";
import { PROVIDERS, getProviderInfo, getApiKey } from "@/utils/provider-config";

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
  const { config, updateConfig } = useAIConfig();
  
  if (!isOpen) return null;

  const providerInfo = getProviderInfo(config.provider);

  // Handle provider change
  const handleProviderChange = (provider: AIConfig["provider"]) => {
    const info = getProviderInfo(provider);
    updateConfig({
      ...config,
      provider,
      selectedModel: info.defaultModel,
    });
  };

  // Handle API key change
  const handleKeyChange = (value: string) => {
    const updates: Record<AIConfig["provider"], Partial<AIConfig>> = {
      gpt: { gptKey: value },
      claude: { claudeKey: value },
      gemini: { geminiKey: value },
      xai: { xaiKey: value },
    };

    updateConfig((prev) => ({
      ...prev,
      ...updates[prev.provider],
    }));
  };

  const handleStartAnalysis = () => {
    const currentKey = getApiKey(config);
    if (!currentKey?.trim()) {
      toast.error(`Please enter your ${providerInfo.keyName}`);
      return;
    }
    
    // save config to local storage
    localStorage.setItem('ai_config', JSON.stringify(config));
    onStartAnalysis();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div
        className="bg-[#1E1E1E] rounded-lg w-full max-w-lg mx-4 border border-[#333333] shadow-xl
                 overflow-hidden"
      >
        <div className="p-5 border-b border-[#333333] flex justify-between items-center">
          <h3 className="text-lg font-medium text-[#2DD4BF]">
            AI Configuration
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Provider
              </label>
              <select
                value={config.provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as AIConfig["provider"])
                }
                className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
              >
                {Object.entries(PROVIDERS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={config.selectedModel}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      selectedModel: e.target.value,
                    }))
                  }
                  className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
                >
                  {providerInfo.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pb-2">
                <input
                  type="checkbox"
                  id="superPrompt"
                  checked={config.superPrompt}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      superPrompt: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-[#2DD4BF] bg-[#2A2A2A] border-[#404040] 
                           rounded focus:ring-[#2DD4BF] focus:ring-offset-[#1E1E1E]"
                />
                <label
                  htmlFor="superPrompt"
                  className="ml-2 cursor-pointer text-sm font-medium text-gray-300"
                >
                  Super Prompt
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Response Language
              </label>
              <Listbox
                value={config.language || "english"}
                onChange={(value) => updateConfig({ ...config, language: value })}
              >
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2 text-left">
                    <span className="block truncate">
                      {
                        RESPONSE_LANGUAGES.find(
                          (l) => l.id === (config.language || "english")
                        )?.name
                      }
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2A2A2A] border border-[#404040] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {RESPONSE_LANGUAGES.filter(lang => 
                      ["english", "chinese-simplified"].includes(lang.id)
                    ).map((language) => (
                      <Listbox.Option
                        key={language.id}
                        value={language.id}
                        className={({ active }: { active: boolean }) =>
                          `relative cursor-pointer select-none py-2 px-4 ${
                            active ? "bg-[#404040] text-white" : "text-gray-300"
                          }`
                        }
                      >
                        {({ selected }: { selected: boolean }) => (
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {language.name}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {providerInfo.keyName}
              </label>
              <input
                type="password"
                value={getApiKey(config)}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={providerInfo.keyPlaceholder}
                className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
              />
              <div className="mt-2 text-sm text-gray-400">
                <p>
                  Need a {providerInfo.keyName}?{" "}
                  <a
                    href={providerInfo.getKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors"
                  >
                    {providerInfo.getKeyText}
                  </a>{" "}
                  (requires registration)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#333333] flex justify-end gap-3">
          <button
            onClick={() => {
              localStorage.removeItem("ai_config");
              updateConfig({
                provider: "gpt",
                gptKey: "",
                claudeKey: "",
                geminiKey: "",
                xaiKey: "",
                selectedModel: GPT_MODELS[0].id,
                language: "english",
                superPrompt: true,
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
            className="px-5 py-2 ml-2 bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4] text-white rounded-lg
                    shadow-lg shadow-[#2DD4BF]/20
                    hover:shadow-xl hover:shadow-[#2DD4BF]/30 
                    transition-all duration-300"
          >
            Start Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
