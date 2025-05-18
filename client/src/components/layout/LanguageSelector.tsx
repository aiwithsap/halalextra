import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  
  const languages = [
    { code: "en", name: "EN", fullName: "English" },
    { code: "ar", name: "AR", fullName: "العربية" },
    { code: "ur", name: "UR", fullName: "اردو" },
    { code: "hi", name: "HI", fullName: "हिन्दी" },
    { code: "bn", name: "BN", fullName: "বাংলা" }
  ];
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  return (
    <div className="relative">
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[70px] h-9 bg-transparent border-gray-300 focus:ring-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className={lang.code === 'ar' || lang.code === 'ur' ? 'arabic-text' : ''}>
              <div className="flex items-center justify-between">
                <span>{lang.name}</span>
                <span className="text-xs text-gray-500 ml-2">{lang.fullName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
