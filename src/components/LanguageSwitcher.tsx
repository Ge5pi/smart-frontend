import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    await i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      title={i18n.language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
    >
      <Globe className="w-5 h-5" />
      <span className="font-medium">
        {i18n.language === 'en' ? 'RU' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
