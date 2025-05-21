import { useTranslation } from "react-i18next";
import MultiStepForm from "@/components/application/MultiStepForm";
import { ClipboardCheck, File, CalendarClock } from "lucide-react";
import GeometricPattern from "@/components/shared/GeometricPattern";

const ApplicationSection = () => {
  const { t } = useTranslation();
  // Use document.dir for RTL support
  const isRtl = document.documentElement.dir === "rtl";

  return (
    <section id="apply" className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 font-medium">
            {t("apply.title")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{t("apply.title")}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto text-lg">
            {t("apply.description")}
          </p>
        </div>
        
        <div className={`grid md:grid-cols-3 gap-8 mb-16 ${isRtl ? "rtl" : ""}`}>
          {/* Step 1 */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
            <h3 className="font-semibold text-xl mb-3">{t("apply.step1Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step1Description")}
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <File className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
            <h3 className="font-semibold text-xl mb-3">{t("apply.step2Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step2Description")}
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CalendarClock className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
            <h3 className="font-semibold text-xl mb-3">{t("apply.step3Title")}</h3>
            <p className="text-gray-600">
              {t("apply.step3Description")}
            </p>
          </div>
        </div>
        
        {/* Application Form Section */}
        <div className="relative bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto border border-gray-100 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <GeometricPattern />
          </div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t("apply.form.title")}</h3>
              <p className="text-gray-600">{t("apply.form.subtitle")}</p>
            </div>
            <MultiStepForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApplicationSection;