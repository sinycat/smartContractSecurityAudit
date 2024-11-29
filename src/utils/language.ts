// Language configuration with supported languages and their instructions
export const RESPONSE_LANGUAGES = [
  {
    id: "english",
    name: "English",
    instruction: "Please respond in English for the following analysis.\n\n",
  },
  {
    id: "chinese-simplified",
    name: "简体中文",
    instruction: "请使用简体中文回复以下分析。\n\n",
  },
  {
    id: "chinese-traditional",
    name: "繁體中文",
    instruction: "請使用繁體中文回覆以下分析。\n\n",
  },
  {
    id: "japanese",
    name: "日本語",
    instruction: "以下の分析を日本語で回答してください。\n\n",
  },
  {
    id: "korean",
    name: "한국어",
    instruction: "다음 분석을 한국어로 답변해 주세요.\n\n",
  },
  // European Languages
  {
    id: "spanish",
    name: "Español",
    instruction: "Por favor, responda el siguiente análisis en español.\n\n",
  },
  {
    id: "french",
    name: "Français",
    instruction: "Veuillez répondre à l'analyse suivante en français.\n\n",
  },
  {
    id: "german",
    name: "Deutsch",
    instruction:
      "Bitte antworten Sie auf die folgende Analyse auf Deutsch.\n\n",
  },
  {
    id: "italian",
    name: "Italiano",
    instruction:
      "Si prega di rispondere alla seguente analisi in italiano.\n\n",
  },
  {
    id: "portuguese",
    name: "Português",
    instruction: "Por favor, responda a seguinte análise em português.\n\n",
  },
  {
    id: "dutch",
    name: "Nederlands",
    instruction:
      "Gelieve de volgende analyse in het Nederlands te beantwoorden.\n\n",
  },
  {
    id: "polish",
    name: "Polski",
    instruction: "Proszę odpowiedzieć na poniższą analizę po polsku.\n\n",
  },
  {
    id: "czech",
    name: "Čeština",
    instruction: "Prosím odpovězte na následující analýzu v češtině.\n\n",
  },
  {
    id: "greek",
    name: "Ελληνικά",
    instruction: "Παρακαλώ απαντήστε στην ακόλουθη ανάλυση στα Ελληνικά.\n\n",
  },
  {
    id: "russian",
    name: "Русский",
    instruction:
      "Пожалуйста, ответьте на следующий анализ на русском языке.\n\n",
  },
  // Middle Eastern Languages
  {
    id: "arabic",
    name: "العربية",
    instruction: "الرجاء الرد على التحليل التالي باللغة العربية.\n\n",
  },
  {
    id: "persian",
    name: "فارسی",
    instruction: "لطفاً به تحلیل زیر به زبان فارسی پاسخ دهید.\n\n",
  },
  {
    id: "turkish",
    name: "Türkçe",
    instruction: "Lütfen aşağıdaki analizi Türkçe olarak yanıtlayın.\n\n",
  },
  {
    id: "hebrew",
    name: "עברית",
    instruction: "אנא השב על הניתוח הבא בעברית.\n\n",
  },
  {
    id: "kurdish",
    name: "کوردی",
    instruction: "تکایە بە زمانی کوردی وەڵامی ئەم شیکارییە بدەوە.\n\n",
  },
  {
    id: "dari",
    name: "دری",
    instruction: "لطفاً به تحلیل ذیل به زبان دری پاسخ دهید.\n\n",
  },
  // Indian Languages
  {
    id: "hindi",
    name: "हिंदी",
    instruction: "कृपया निम्नलिखित विश्लेषण का उत्तर हिंदी में दें।\n\n",
  },
  {
    id: "bengali",
    name: "বাংলা",
    instruction: "অনুগ্রহ করে নিম্নলিখিত বিশ্লেষণের উত্তর বাংলায় দিন।\n\n",
  },
  {
    id: "telugu",
    name: "తెలుగు",
    instruction: "దయచేసి కింది విశ్లేషణకు తెలుగులో సమాధానం ఇవ్వండి.\n\n",
  },
  {
    id: "marathi",
    name: "मराठी",
    instruction: "कृपया खालील विश्लेषणाचे उत्तर मराठीत द्या.\n\n",
  },
  {
    id: "tamil",
    name: "தமிழ்",
    instruction: "பின்வரும் பகுப்பாய்வுக்கு தமிழில் பதிலளிக்கவும்.\n\n",
  },
  {
    id: "gujarati",
    name: "ગુજરાતી",
    instruction: "કૃપા કરીને નીચેના વિશ્લેષણનો જવાબ ગુજરાતીમાં આપો.\n\n",
  },
  {
    id: "kannada",
    name: "ಕನ್ನಡ",
    instruction: "ದಯವಿಟ್ಟು ಈ ಕೆಳಗಿನ ವಿಶ್ಲೇಷಣೆಗೆ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.\n\n",
  },
  {
    id: "malayalam",
    name: "മലയാളം",
    instruction: "ദയവായി താഴെയുള്ള വിശകലനത്തിന് മലയാളത്തിൽ മറുപടി നൽകുക.\n\n",
  },
  {
    id: "punjabi",
    name: "ਪੰਜਾਬੀ",
    instruction:
      "ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਦਿੱਤੇ ਵਿਸ਼ਲੇਸ਼ਣ ਦਾ ਜਵਾਬ ਪੰਜਾਬੀ ਵਿੱਚ ਦਿਓ।\n\n",
  },
  {
    id: "urdu",
    name: "اردو",
    instruction: "براہ کرم درج ذیل تجزیہ کا جواب اردو میں دیں۔\n\n",
  },
  // Southeast Asian Languages
  {
    id: "vietnamese",
    name: "Tiếng Việt",
    instruction: "Vui lòng trả lời phân tích sau bằng tiếng Việt.\n\n",
  },
  {
    id: "thai",
    name: "ไทย",
    instruction: "กรุณาตอบการวิเคราะห์ต่อไปนี้เป็นภาษาไทย\n\n",
  },
  {
    id: "indonesian",
    name: "Bahasa Indonesia",
    instruction: "Mohon jawab analisis berikut dalam Bahasa Indonesia.\n\n",
  },
] as const;

// Type for supported language IDs
export type SupportedLanguage = (typeof RESPONSE_LANGUAGES)[number]["id"];

// Get language instruction based on language ID
export const getLanguageInstruction = (language?: string) => {
  const lang = RESPONSE_LANGUAGES.find((l) => l.id === language);
  return lang?.instruction || RESPONSE_LANGUAGES[0].instruction;
};

// Create a prompt with the appropriate language instruction
export const createPromptWithLanguage = (prompt: string, language?: string) => {
  const languageInstruction = getLanguageInstruction(language);
  return languageInstruction + prompt;
};
