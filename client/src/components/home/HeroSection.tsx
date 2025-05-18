import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import GeometricPattern from "@/components/shared/GeometricPattern";

const HeroSection = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <section className="relative bg-primary overflow-hidden">
      <GeometricPattern className="absolute inset-0 opacity-10" />
      
      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className={`grid md:grid-cols-2 gap-8 items-center ${isRtl ? "rtl" : ""}`}>
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-primary-100 text-lg mb-8 max-w-lg">
              {t("hero.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/verify">
                <Button className="bg-white hover:bg-gray-100 text-primary w-full sm:w-auto">
                  <i className="ri-qr-scan-line mr-2"></i>
                  {t("hero.verifyButton")}
                </Button>
              </Link>
              <Link href="/apply">
                <Button className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto">
                  <i className="ri-file-list-3-line mr-2"></i>
                  {t("hero.applyButton")}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <img 
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
              alt={t("hero.imageAlt")} 
              className="rounded-lg shadow-lg max-w-full w-full md:max-w-md" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
