import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || "en");
  const [isRtl, setIsRtl] = useState(false);

  // Update the UI direction based on language
  useEffect(() => {
    // Arabic and Urdu are RTL languages
    const rtlLanguages = ["ar", "ur"];
    const isRightToLeft = rtlLanguages.includes(language);
    
    // Set the direction attribute on the html element
    document.documentElement.dir = isRightToLeft ? "rtl" : "ltr";
    setIsRtl(isRightToLeft);
    
    // Apply the appropriate font family
    if (language === "ar" || language === "ur") {
      document.documentElement.classList.add("arabic-text");
    } else {
      document.documentElement.classList.remove("arabic-text");
    }
  }, [language]);

  // Change language and store preference
  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Load language preference from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};
