import {
  createContext,
} from "react";

export const LANGUAGE_STORAGE_KEY =
  "nexora_language";

export const TRANSLATION_CACHE_STORAGE_KEY =
  "nexora_dynamic_translation_cache_v2";

export const DEFAULT_LANGUAGE =
  "en";

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
  {
    code: "si",
    name: "Sinhala",
    nativeName: "සිංහල",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
  },
];

export const LanguageContext =
  createContext(null);