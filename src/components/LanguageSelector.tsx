import React, { useEffect, useState } from 'react';

// Minimal comprehensive language list (ISO 639-1 codes). Add/remove entries as needed.
const LANGUAGES: Array<{ code: string; name: string }> = [
  { code: 'auto', name: 'Auto (browser)' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'th', name: 'ไทย' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'zh', name: '中文 (简体/繁體)' },
  // The list can be extended to include all ISO 639-1 codes if desired.
];

export const LanguageSelector: React.FC = () => {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'id';
    return window.localStorage.getItem('preferred_language') || 'id';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('preferred_language', lang);
    // notify other parts of the app that language changed
    window.dispatchEvent(new CustomEvent('preferred-language-changed', { detail: { language: lang } }));
  }, [lang]);

  return (
    <div className="hidden md:flex items-center ml-3">
      <label htmlFor="lang-select" className="sr-only">Language</label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="text-xs bg-transparent border border-white/5 rounded px-2 py-1 text-slate-200"
        title="Pilih bahasa respons"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
