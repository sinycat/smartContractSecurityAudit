import { useState } from 'react';
import { useAIConfig } from '@/utils/ai';
import { GPT_MODELS } from '@/utils/openai-models';
import toast from 'react-hot-toast';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
}

type Provider = 'gpt' | 'claude';

export default function AIConfigModal({ isOpen, onClose, onStartAnalysis }: AIConfigModalProps) {
  const { config, setConfig } = useAIConfig();
  const [provider, setProvider] = useState<Provider>('gpt');
  const [gptKey, setGptKey] = useState(config.gptKey || '');
  const [claudeKey, setClaudeKey] = useState(config.claudeKey || '');
  const [selectedModel, setSelectedModel] = useState(GPT_MODELS[0].id);

  const handleSubmit = () => {
    // Validate API Key based on provider
    const currentKey = provider === 'gpt' ? gptKey : claudeKey;
    if (!currentKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    try {
      // Save configuration
      setConfig({
        provider,
        gptKey,
        claudeKey,
        selectedModel: provider === 'gpt' ? selectedModel : 'claude-3-sonnet-20240229'
      });

      onStartAnalysis();
      onClose();
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Failed to start analysis. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-[#1E1E1E] rounded-lg border border-[#333333] p-6 w-[480px] z-50">
        <h3 className="text-xl font-semibold text-white mb-4">AI Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">AI Provider</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
            >
              <option value="gpt">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          {provider === 'gpt' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">GPT Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
              >
                {GPT_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {provider === 'gpt' ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
              <input 
                type="password"
                value={gptKey}
                onChange={(e) => setGptKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Anthropic API Key</label>
              <input 
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="Enter your Anthropic API key"
                className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
              />
            </div>
          )}

          <div className="text-sm text-gray-400">
            <p>API Key Instructions:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>OpenAI API Key: Get from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#FF8B3E] hover:underline">OpenAI Dashboard</a></li>
              <li>Anthropic API Key: Get from <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="text-[#FF8B3E] hover:underline">Anthropic Console</a></li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#FF8B3E] text-white rounded-lg hover:bg-[#FF8B3E]/90 transition-colors"
          >
            Start Analysis
          </button>
        </div>
      </div>
    </>
  );
} 