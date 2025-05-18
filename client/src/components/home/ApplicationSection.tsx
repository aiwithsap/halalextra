import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import MultiStepForm from "@/components/application/MultiStepForm";

const ApplicationSection = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <section id="apply" className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("apply.title")}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            {t("apply.description")}
          </p>
        </div>
        
        <div className={`grid md:grid-cols-3 gap-6 mb-12 ${isRtl ? "rtl" : ""}`}>
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{t("apply.step1Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step1Description")}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{t("apply.step2Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step2Description")}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{t("apply.step3Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step3Description")}
            </p>
          </div>
        </div>
        
        {/* Multi-step Application Form */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <MultiStepForm />
        </div>
      </div>
    </section>
  );
};

export default ApplicationSection;
