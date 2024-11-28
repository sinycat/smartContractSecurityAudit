import { useState } from 'react';
import { useAIConfig } from '@/utils/ai';
import toast from 'react-hot-toast';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
}

export default function AIConfigModal({ isOpen, onClose, onStartAnalysis }: AIConfigModalProps) {
  const { config, setConfig } = useAIConfig();
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [provider, setProvider] = useState<'gpt35' | 'gpt4' | 'claude'>(config.provider || 'gpt35');

  const handleSubmit = () => {
    // Validate API Key
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    try {
      // Save configuration
      setConfig({
        provider,
        apiKey
      });

      // Call analysis function
      onStartAnalysis();
      
      // Close modal
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
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
            >
              <option value="gpt35">GPT-3.5-Turbo</option>
              <option value="gpt4">GPT-4</option>
              <option value="claude">Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full bg-[#252525] border border-[#333333] rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="text-sm text-gray-400">
            <p>API Key Instructions:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>GPT-3.5/GPT-4: Use OpenAI API Key</li>
              <li>Claude: Use Anthropic API Key</li>
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