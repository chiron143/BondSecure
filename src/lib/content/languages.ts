// Languages offered for the translated explanation. Chosen from the largest groups of
// international students in Australia. The letter itself is always in English.

export const LANGUAGES = [
  { code: "en", english: "English", native: "English" },
  { code: "zh", english: "Simplified Chinese", native: "简体中文" },
  { code: "hi", english: "Hindi", native: "हिन्दी" },
  { code: "ne", english: "Nepali", native: "नेपाली" },
  { code: "vi", english: "Vietnamese", native: "Tiếng Việt" },
  { code: "id", english: "Indonesian", native: "Bahasa Indonesia" },
  { code: "th", english: "Thai", native: "ไทย" },
  { code: "ko", english: "Korean", native: "한국어" },
  { code: "ur", english: "Urdu", native: "اردو" },
  { code: "pa", english: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "bn", english: "Bengali", native: "বাংলা" },
  { code: "es", english: "Spanish", native: "Español" },
  { code: "pt", english: "Brazilian Portuguese", native: "Português" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
