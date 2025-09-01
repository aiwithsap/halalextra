import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import ApplicationSection from "@/components/home/ApplicationSection";
import GeometricPattern from "@/components/shared/GeometricPattern";

const Apply = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t("meta.apply.title")}</title>
        <meta name="description" content={t("meta.apply.description")} />
        <meta property="og:title" content={t("meta.apply.title")} />
        <meta property="og:description" content={t("meta.apply.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("apply.pageTitle")}</h1>
            <p className="text-xl text-primary-100">{t("apply.pageSubtitle")}</p>
          </div>
        </div>
      </div>
      
      <ApplicationSection />
    </>
  );
};

export default Apply;
