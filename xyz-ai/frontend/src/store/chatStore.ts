import { create } from 'zustand';
import type { SupportedLanguage } from '../services/languageService';

export type Role = 'student' | 'parent' | 'teacher' | 'principal';
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  suggestedFollowUps?: string[];
  needsClarification?: boolean;
}

interface ChatState {
  messages: Message[];
  currentRole: Role;
  userId: string;
  isLoading: boolean;
  language: SupportedLanguage;
  avatarState: AvatarState;
  addMessage: (message: Message) => void;
  setRole: (role: Role) => void;
  setUserId: (id: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setAvatarState: (state: AvatarState) => void;
}

// Multilingual welcome messages for all 11 languages × 4 roles
const welcomeMessages: Record<Role, Partial<Record<SupportedLanguage, string>>> = {
  student: {
    en: "Hello! I'm your Academic Assistant. I can help with attendance, leaves, notices, and school questions. What would you like to know?",
    hi: "नमस्ते! मैं आपका शैक्षणिक सहायक हूँ। मैं उपस्थिति, छुट्टी, नोटिस और स्कूल के सवालों में मदद कर सकता हूँ। आप क्या जानना चाहेंगे?",
    ta: "வணக்கம்! நான் உங்கள் கல்வி உதவியாளர். வருகை, விடுப்பு, அறிவிப்புகள் மற்றும் பள்ளி கேள்விகளுக்கு உதவ முடியும். என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?",
    te: "నమస్కారం! నేను మీ విద్యా సహాయకుడిని. హాజరు, సెలవు, నోటీసులు మరియు పాఠశాల ప్రశ్నలతో సహాయం చేయగలను. మీకు ఏమి తెలుసుకోవాలి?",
    mr: "नमस्कार! मी तुमचा शैक्षणिक सहाय्यक आहे. मी उपस्थिती, रजा, नोटीस आणि शाळेच्या प्रश्नांमध्ये मदत करू शकतो. तुम्हाला काय जाणून घ्यायचे आहे?",
    bn: "নমস্কার! আমি আপনার শিক্ষাগত সহকারী। উপস্থিতি, ছুটি, নোটিস এবং স্কুলের প্রশ্নে সাহায্য করতে পারি। আপনি কী জানতে চান?",
    gu: "નમસ્તે! હું તમારો શૈક્ષણિક સહાયક છું. હું હાજરી, રજા, નોટિસ અને શાળાના પ્રશ્નોમાં મદદ કરી શકું છું. તમે શું જાણવા માંગો છો?",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਵਿੱਦਿਅਕ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਹਾਜ਼ਰੀ, ਛੁੱਟੀ, ਨੋਟਿਸ ਅਤੇ ਸਕੂਲ ਦੇ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಶೈಕ್ಷಣಿಕ ಸಹಾಯಕ. ಹಾಜರಾತಿ, ರಜೆ, ನೋಟೀಸ್ ಮತ್ತು ಶಾಲೆಯ ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?",
    ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ അക്കാദമിക് അസിസ്റ്റന്റ് ആണ്. ഹാജർ, അവധി, നോട്ടീസ്, സ്കൂൾ ചോദ്യങ്ങൾ എന്നിവയിൽ സഹായിക്കാം. എന്ത് അറിയണം?",
    ur: "آداب! میں آپ کا تعلیمی معاون ہوں۔ حاضری، چھٹی، نوٹس اور اسکول کے سوالات میں مدد کر سکتا ہوں۔ آپ کیا جاننا چاہتے ہیں؟",
  },
  parent: {
    en: "Hello! I'm your Parent Support Assistant. I can help check your child's attendance, apply for leave, schedule teacher meetings, and more. How can I help?",
    hi: "नमस्ते! मैं आपका अभिभावक सहायक हूँ। मैं आपके बच्चे की उपस्थिति जांच, छुट्टी आवेदन, शिक्षक से मिलना और अधिक में मदद कर सकता हूँ। मैं कैसे सहायता करूँ?",
    ta: "வணக்கம்! நான் உங்கள் பெற்றோர் ஆதரவு உதவியாளர். உங்கள் குழந்தையின் வருகை, விடுப்பு, ஆசிரியர் சந்திப்பு ஆகியவற்றில் உதவலாம். எப்படி உதவட்டும்?",
    te: "నమస్కారం! నేను మీ తల్లిదండ్రుల సహాయకుడిని. మీ పిల్లల హాజరు, సెలవు దరఖాస్తు, ఉపాధ్యాయుడితో సమావేశం మొదలైన వాటిలో సహాయపడగలను.",
    mr: "नमस्कार! मी तुमचा पालक सहाय्यक आहे. मुलाची उपस्थिती, रजा, शिक्षकांशी भेट यांसाठी मदत करू शकतो. कसे सहाय्य करू?",
    bn: "নমস্কার! আমি আপনার অভিভাবক সহকারী। আপনার সন্তানের উপস্থিতি, ছুটির আবেদন, শিক্ষকের সাথে মিটিং ইত্যাদিতে সাহায্য করতে পারি।",
    gu: "નમસ્તે! હું તમારો વાલી સહાયક છું। બાળકની હાજરી, રજા, શિક્ષક સાથે મીટિંગ વગેરેમાં મદદ કરી શકું છું.",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਮਾਤਾ-ਪਿਤਾ ਸਹਾਇਕ ਹਾਂ। ਬੱਚੇ ਦੀ ਹਾਜ਼ਰੀ, ਛੁੱਟੀ, ਅਧਿਆਪਕ ਨਾਲ ਮੁਲਾਕਾਤ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪಾಲಕರ ಸಹಾಯಕ. ಮಗುವಿನ ಹಾಜರಾತಿ, ರಜೆ ಅರ್ಜಿ, ಶಿಕ್ಷಕರ ಭೇಟಿ ಇತ್ಯಾದಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
    ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ രക്ഷിതാവ് അസിസ്റ്റന്റ് ആണ്. കുട്ടിയുടെ ഹാജർ, അവധി അപേക്ഷ, അധ്യാപകനുമായി കൂടിക്കാഴ്ച ഇവയിൽ സഹായിക്കാം.",
    ur: "آداب! میں آپ کا والدین کا معاون ہوں۔ بچے کی حاضری، چھٹی کی درخواست، استاد سے ملاقات وغیرہ میں مدد کر سکتا ہوں۔",
  },
  teacher: {
    en: "Hello! I'm your Teaching Assistant. I can help mark attendance, view class reports, send notices, and manage student concerns. What would you like to do?",
    hi: "नमस्ते! मैं आपका शिक्षण सहायक हूँ। मैं उपस्थिति दर्ज करना, कक्षा रिपोर्ट, नोटिस भेजना और छात्र मामलों में मदद कर सकता हूँ।",
    ta: "வணக்கம்! நான் உங்கள் ஆசிரிய உதவியாளர். வருகை பதிவு, வகுப்பு அறிக்கைகள், நோட்டீஸ் அனுப்புவது ஆகியவற்றில் உதவலாம்.",
    te: "నమస్కారం! నేను మీ బోధనా సహాయకుడిని. హాజరు నమోదు, తరగతి నివేదికలు, నోటీసులు పంపడం మొదలైన వాటిలో సహాయపడగలను.",
    mr: "नमस्कार! मी तुमचा शिक्षण सहाय्यक आहे. उपस्थिती नोंद, वर्ग अहवाल, नोटीस पाठवणे यात मदत करू शकतो.",
    bn: "নমস্কার! আমি আপনার শিক্ষণ সহকারী। উপস্থিতি নথিভুক্ত করা, ক্লাস রিপোর্ট, নোটিস পাঠানো ইত্যাদিতে সাহায্য করতে পারি।",
    gu: "નમસ્તે! હું તમારો શિક્ષણ સહાયક છું. હાજરી નોંધ, ક્લાસ રિપોર્ટ, નોટિસ મોકલવા વગેરેમાં મદદ કરી શકું છું.",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਅਧਿਆਪਨ ਸਹਾਇਕ ਹਾਂ। ਹਾਜ਼ਰੀ ਦਰਜ ਕਰਨਾ, ਕਲਾਸ ਰਿਪੋਰਟ, ਨੋਟਿਸ ਭੇਜਣਾ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಬೋಧನಾ ಸಹಾಯಕ. ಹಾಜರಾತಿ ದಾಖಲು, ತರಗತಿ ವರದಿ, ನೋಟೀಸ್ ಕಳುಹಿಸುವ ಕೆಲಸದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
    ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ടീചിംഗ് അസിസ്റ്റന്റ് ആണ്. ഹാജർ രേഖപ്പെടുത്തൽ, ക്ലാസ് റിപ്പോർട്ട്, നോട്ടീസ് അയക്കൽ ഇവയിൽ സഹായിക്കാം.",
    ur: "آداب! میں آپ کا تدریسی معاون ہوں۔ حاضری، کلاس رپورٹ، نوٹس بھیجنا وغیرہ میں مدد کر سکتا ہوں۔",
  },
  principal: {
    en: "Hello! I'm your Management Assistant. I can help with school analytics, send announcements, review attendance trends, and monitor the system. What do you need?",
    hi: "नमस्ते! मैं आपका प्रबंधन सहायक हूँ। विद्यालय विश्लेषण, घोषणाएं, उपस्थिति रुझान और प्रणाली निगरानी में मदद कर सकता हूँ।",
    ta: "வணக்கம்! நான் உங்கள் நிர்வாக உதவியாளர். பள்ளி பகுப்பாய்வு, அறிவிப்புகள், வருகை போக்குகள் ஆகியவற்றில் உதவலாம்.",
    te: "నమస్కారం! నేను మీ నిర్వహణ సహాయకుడిని. పాఠశాల విశ్లేషణలు, ప్రకటనలు, హాజరు ధోరణులు మొదలైన వాటిలో సహాయపడగలను.",
    mr: "नमस्कार! मी तुमचा व्यवस्थापन सहाय्यक आहे. शाळा विश्लेषण, घोषणा, उपस्थिती कल यात मदत करू शकतो.",
    bn: "নমস্কার! আমি আপনার ব্যবস্থাপনা সহকারী। স্কুল বিশ্লেষণ, ঘোষণা, উপস্থিতির প্রবণতা পর্যালোচনায় সাহায্য করতে পারি।",
    gu: "નમસ્તે! હું તમારો મેનેજમેન્ટ સહાયક છું. શાળા વિશ્લેષણ, ઘોષણા, હાજરી ટ્રેન્ડ વગેરેમાં મદદ કરી શકું છું.",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਪ੍ਰਬੰਧਨ ਸਹਾਇਕ ਹਾਂ। ਸਕੂਲ ਵਿਸ਼ਲੇਸ਼ਣ, ਘੋਸ਼ਣਾਵਾਂ, ਹਾਜ਼ਰੀ ਰੁਝਾਨਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ನಿರ್ವಹಣಾ ಸಹಾಯಕ. ಶಾಲಾ ವಿಶ್ಲೇಷಣೆ, ಪ್ರಕಟಣೆಗಳು, ಹಾಜರಾತಿ ಪ್ರವೃತ್ತಿ ಇವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
    ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ മാനേജ്മെന്റ് അസിസ്റ്റന്റ് ആണ്. സ്കൂൾ അനലിറ്റിക്സ്, അറിയിപ്പുകൾ, ഹാജർ ട്രെൻഡ് ഇവ നിരീക്ഷിക്കാൻ സഹായിക്കാം.",
    ur: "آداب! میں آپ کا انتظامی معاون ہوں۔ اسکول کا تجزیہ، اعلانات، حاضری کے رجحانات اور نظام کی نگرانی میں مدد کر سکتا ہوں۔",
  },
};

const getWelcomeMessage = (role: Role, language: SupportedLanguage): string => {
  return welcomeMessages[role]?.[language]
    || welcomeMessages[role]?.['en']
    || "Hello! I'm XYZ AI. How can I help you today?";
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [{ role: 'assistant', content: getWelcomeMessage('student', 'en') }],
  currentRole: 'student',
  userId: 'student123',
  language: 'en',
  isLoading: false,
  avatarState: 'idle',
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setRole: (role) => set((state) => ({
    currentRole: role,
    messages: [{ role: 'assistant', content: getWelcomeMessage(role, state.language) }]
  })),
  setUserId: (userId) => set({ userId }),
  setLanguage: (language) => set((state) => ({
    language,
    // Reset with welcome in new language so the user sees the language has changed
    messages: [{ role: 'assistant', content: getWelcomeMessage(state.currentRole, language) }]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set((state) => ({
    messages: [{ role: 'assistant', content: getWelcomeMessage(state.currentRole, state.language) }]
  })),
  setAvatarState: (avatarState) => set({ avatarState })
}));
