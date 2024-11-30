export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast and efficient model for quick responses",
    contextWindow: 12000,
  },
  {
    id: "gemini-1.5-flash-8b",
    name: "Gemini 1.5 Flash 8B",
    description: "Lightweight version optimized for efficiency",
    contextWindow: 12000,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Advanced model with enhanced capabilities",
    contextWindow: 128000,
  },
  {
    id: "gemini-exp-1121",
    name: "Gemini Experimental 1121",
    description: "Experimental version with latest features",
    contextWindow: 128000,
  },
  {
    id: "gemini-exp-1114",
    name: "Gemini Experimental 1114",
    description: "Experimental version for testing",
    contextWindow: 128000,
  },
];

export const getGeminiModelById = (modelId: string): GeminiModel | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
}; 