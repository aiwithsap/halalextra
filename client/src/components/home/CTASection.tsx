import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className={`max-w-3xl mx-auto text-center ${isRtl ? "rtl" : ""}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("cta.title")}</h2>
          <p className="text-primary-100 mb-8 text-lg">
            {t("cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply">
              <Button className="bg-accent hover:bg-accent/90 text-white font-medium py-3 px-8 w-full sm:w-auto">
                {t("cta.applyButton")}
              </Button>
            </Link>
            <Link href="/about">
              <Button className="bg-transparent hover:bg-white/10 border border-white text-white font-medium py-3 px-8 w-full sm:w-auto">
                {t("cta.learnMoreButton")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
