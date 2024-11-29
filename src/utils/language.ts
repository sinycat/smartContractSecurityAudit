
export const RESPONSE_LANGUAGES = [
  { 
    id: 'english', 
    name: 'English',
    instruction: 'Please respond in English for the following analysis.\n\n'
  },
  { 
    id: 'chinese', 
    name: '中文',
    instruction: '请使用中文回复以下分析。\n\n'
  },
  { 
    id: 'japanese', 
    name: '日本語',
    instruction: '以下の分析を日本語で回答してください。\n\n'
  },
  { 
    id: 'korean', 
    name: '한국어',
    instruction: '다음 分析을 한국어로 답변해 주세요。\n\n'
  },
  { 
    id: 'spanish', 
    name: 'Español',
    instruction: 'Por favor, responda el siguiente análisis en español.\n\n'
  }
] as const;

export type SupportedLanguage = typeof RESPONSE_LANGUAGES[number]['id'];

// get language instruction
export const getLanguageInstruction = (language?: string) => {
  const lang = RESPONSE_LANGUAGES.find(l => l.id === language);
  return lang?.instruction || RESPONSE_LANGUAGES[0].instruction;
};

// create prompt with language
export const createPromptWithLanguage = (prompt: string, language?: string) => {
  const languageInstruction = getLanguageInstruction(language);
  return languageInstruction + prompt;
}; 