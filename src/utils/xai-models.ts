export interface XAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const XAI_MODELS: XAIModel[] = [
  {
    id: "grok-beta",
    name: "grok-beta",
    description: "xAI's Grok model for advanced language understanding",
    contextWindow: 131072,
  },
];

export const getXAIModelById = (modelId: string): XAIModel | undefined => {
  return XAI_MODELS.find((model) => model.id === modelId);
}; 