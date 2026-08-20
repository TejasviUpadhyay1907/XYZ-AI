// Language Service for Eduvia AI School Assistant
// Supports 11 languages: English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Punjabi, Kannada, Malayalam, Urdu

export type SupportedLanguage =
  | 'en'  // English
  | 'hi'  // Hindi
  | 'ta'  // Tamil
  | 'te'  // Telugu
  | 'mr'  // Marathi
  | 'bn'  // Bengali
  | 'gu'  // Gujarati
  | 'pa'  // Punjabi
  | 'kn'  // Kannada
  | 'ml'  // Malayalam
  | 'ur'; // Urdu

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  rtl: boolean; // Right-to-left (for Urdu)
}

// Language data with native names
const LANGUAGE_DATA: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    rtl: false
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    rtl: false
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    rtl: false
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    rtl: false
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    rtl: false
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    rtl: false
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    rtl: false
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    rtl: false
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    rtl: false
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اُردُو',
    rtl: true
  }
};

// Mock translation function - in a real app, this would use a translation API or i18n library
// For demo purposes, we'll return placeholder translations for common phrases
export const translate = (key: string, language: SupportedLanguage = 'en'): string => {
  // Common UI translations for demo
  const translations: Record<string, Partial<Record<SupportedLanguage, string>>> = {
    // Header
    'welcome': {
      en: 'Welcome',
      hi: 'स्वागत है',
      ta: 'வருகை',
      te: 'స్వాగతం',
      mr: 'स्वागत',
      bn: 'স্বাগতম',
      gu: 'સ્વાગત',
      pa: 'ਸਵਾਗਤ',
      kn: 'ಸ್ವಾಗತ',
      ml: 'സ്വാഗതം',
      ur: 'خوش آمدید'
    },
    'online': {
      en: 'Online',
      hi: 'ऑनलाइन',
      ta: 'ออนไลน์',
      te: 'ఆన్లైన్',
      mr: 'ऑनलाइन',
      bn: 'অনলাইন',
      gu: 'অনলাইন',
      pa: 'ਓਨਲਾਈਨ',
      kn: 'ಆನ್‌ಲೈನ್',
      ml: 'ഒന്‍ലൈന്‍',
      ur: 'آن لائن'
    },
    'settings': {
      en: 'Settings',
      hi: 'सेटिंग्स',
      ta: 'அமைப்புகள்',
      te: 'సెట్టింగ్స్',
      mr: 'सेटिंग्स',
      bn: 'সেটিংস',
      gu: 'સેટિંગ્સ',
      pa: 'ਸੈਟਿੰਗz',
      kn: 'ಸೆಟ್ಗ್',
      ml: 'സെറ്റിംഗ്സ്',
      ur: 'سیٹنگز'
    },
    'logout': {
      en: 'Logout',
      hi: 'लॉगआउट',
      ta: 'வெளியேறு',
      te: 'లాగ్ఔಟ್',
      mr: 'लॉगआउट',
      bn: 'লগআউট',
      gu: 'લોગઆઉટ',
      pa: 'ਲੌਗਆਉਟ',
      kn: 'ಲಾಗ்ஔಟ್',
      ml: 'ലോഗ puits',
      ur: 'لاگ آؤٹ'
    },
    // Roles
    'student': {
      en: 'Student',
      hi: 'छात्र',
      ta: 'மாணவர்',
      te: 'విద్యార్థి',
      mr: 'विद्यार्थी',
      bn: 'ছাত্র',
      gu: 'શિષ્ય',
      pa: 'ਛਾਤਰ',
      kn: 'ವಿದ್ಯಾರ್ಥಿ',
      ml: 'വിദ്യാർത്ഥി',
      ur: 'طالب علم'
    },
    'parent': {
      en: 'Parent',
      hi: 'अभिभावक',
      ta: 'தந்தை',
      te: 'మాతా',
      mr: 'पालक',
      bn: 'পিতামাতা',
      gu: 'માતા-પિતા',
      pa: 'ਮਾਤਾ-ਪਿਤਾ',
      kn: 'ಮ disque',
      ml: 'മാതാപിതা',
      ur: 'والدین'
    },
    'teacher': {
      en: 'Teacher',
      hi: 'शिक्षक',
      ta: 'அசிரியர்',
      te: 'అధ్యాపకుడు',
      mr: 'शिक्षक',
      bn: 'শিক্ষক',
      gu: 'શિક્ષક',
      pa: 'ਸ਼ਿਕਸ਼ਕ',
      kn: 'ಶಿಕ್ಷಕ',
      ml: 'അധ്യാപകൻ',
      ur: 'استاد'
    },
    'principal': {
      en: 'Principal',
      hi: 'प्रधानाचार्य',
      ta: 'প্রinciple',
      te: 'ప్రిన్సిపల్',
      mr: 'प्रमुखाध्यापक',
      bn: 'প্র Bray',
      gu: 'મુખ્ય શિક્ષક',
      pa: 'ਮੁਖਿਆ శਿਕਸ਼ਕ',
      kn: 'ಪ್ರಭ 중심',
      ml: 'പ്രഭ Kerala',
      ur: 'Principal'
    },
    // Chat placeholders
    'type_a_message': {
      en: 'Type a message...',
      hi: 'एक संदेश टाइप करें...',
      ta: 'ஒரு செய்தியை տDiego...',
      te: ' sebuah mensaje...',
      mr: 'एक संदेश टाइप करा...',
      bn: 'একটি বার্তা টাইপ করুন...',
      gu: 'એક સંદેશ ટાઇપ કરો...',
      pa: 'ਇੱਕ ਮਿਸੇਜ ਟਾਈਪ ਕਰੋ...',
      kn: 'ಒಂದು ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...',
      ml: 'ഒരു സന്ദേശം ടൈപ്പ് ചെയ്യുക...',
      ur: 'ایک پیغام تحریر کریں...'
    },
    // Common phrases
    'hello': {
      en: 'Hello',
      hi: 'नमस्ते',
      ta: 'வணக்கம்',
      te: 'నమస్కారం',
      mr: 'नमस्कार',
      bn: 'নমস্কার',
      gu: 'નમસ્તે',
      pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
      kn: 'ನಮಸ್ಕಾರ',
      ml: 'നമസ്കാരം',
      ur: 'السلام عليكم'
    },
    'how_can_i_help': {
      en: 'How can I help?',
      hi: 'मैं कैसे मदद कर सकता हूं?',
      ta: 'நான் எப்படி உதவலாம்?',
      te: 'నేను ఎలా సహాయం చేయగలను?',
      mr: 'मी कशी मदद करतो?',
      bn: 'আমি কীভাবে সাহায্য করতে পারি?',
      gu: 'હું કેવી રીતે Madad karũ?',
      pa: 'ਮੈਂ ਕਿਵੇਂ madad kar sakke hā̃?',
      kn: 'ನಾನು எníkು ಸಹಾಯ ಮಾಡಬಲ್ಲีก؟',
      ml: 'എനിക്ക് എങ്ങനെ സഹായിക്കാൻ കഴിയും?',
      ur: 'میں کیسے مدد کر سکتا ہوں؟'
    }
  };

  // Return translation if available, otherwise fallback to English
  const translation = translations[key]?.[language];
  if (translation) return translation;

  // Fallback to English
  return translations[key]?.en || key;
};

// Get all supported languages
export const getSupportedLanguages = (): LanguageInfo[] => {
  return Object.values(LANGUAGE_DATA);
};

// Get language info by code
export const getLanguageInfo = (code: SupportedLanguage): LanguageInfo => {
  return LANGUAGE_DATA[code] || LANGUAGE_DATA.en;
};

// Detect language from browser or URL (simplified)
export const detectLanguage = (): SupportedLanguage => {
  // Try to get from localStorage first
  const savedLang = localStorage.getItem('xyz-ai-language');
  if (savedLang && Object.values(LANGUAGE_DATA).some(lang => lang.code === savedLang)) {
    return savedLang as SupportedLanguage;
  }

  // Try browser language
  const browserLang = navigator.language.substring(0, 2) as SupportedLanguage;
  if (Object.values(LANGUAGE_DATA).some(lang => lang.code === browserLang)) {
    return browserLang;
  }

  // Default to English
  return 'en';
};

// Save language preference
export const saveLanguagePreference = (language: SupportedLanguage): void => {
  localStorage.setItem('xyz-ai-language', language);
};

// Get text direction for a language
export const getLanguageDirection = (language: SupportedLanguage): 'ltr' | 'rtl' => {
  return LANGUAGE_DATA[language]?.rtl ? 'rtl' : 'ltr';
};