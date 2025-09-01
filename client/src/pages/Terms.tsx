import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import GeometricPattern from "@/components/shared/GeometricPattern";

const Terms = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t("terms.title")}</title>
        <meta name="description" content={t("meta.terms.description")} />
        <meta property="og:title" content={t("terms.title")} />
        <meta property="og:description" content={t("meta.terms.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("terms.title")}</h1>
            <p className="text-xl text-primary-100">{t("terms.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className={`max-w-4xl mx-auto ${isRtl ? "rtl" : ""}`}>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-500 mb-8">
              {t("terms.lastUpdated")}: {t("terms.lastUpdatedDate")}
            </p>

            <h2>{t("terms.section1.title")}</h2>
            <p>{t("terms.section1.content1")}</p>
            <p>{t("terms.section1.content2")}</p>

            <h2>{t("terms.section2.title")}</h2>
            <p>{t("terms.section2.content1")}</p>
            <p>{t("terms.section2.content2")}</p>

            <h2>{t("terms.section3.title")}</h2>
            <p>{t("terms.section3.content1")}</p>
            <ul>
              <li>{t("terms.section3.bullet1")}</li>
              <li>{t("terms.section3.bullet2")}</li>
              <li>{t("terms.section3.bullet3")}</li>
              <li>{t("terms.section3.bullet4")}</li>
            </ul>

            <h2>{t("terms.section4.title")}</h2>
            <p>{t("terms.section4.content1")}</p>
            <p>{t("terms.section4.content2")}</p>

            <h2>{t("terms.section5.title")}</h2>
            <p>{t("terms.section5.content1")}</p>
            <p>{t("terms.section5.content2")}</p>

            <h2>{t("terms.section6.title")}</h2>
            <p>{t("terms.section6.content1")}</p>
            <p>{t("terms.section6.content2")}</p>

            <h2>{t("terms.section7.title")}</h2>
            <p>{t("terms.section7.content1")}</p>
            <p>{t("terms.section7.content2")}</p>

            <h2>{t("terms.section8.title")}</h2>
            <p>{t("terms.section8.content")}</p>
            <ul>
              <li>
                <strong>{t("terms.section8.contact.title")}</strong>
                <br />
                {t("terms.section8.contact.email")}
                <br />
                {t("terms.section8.contact.phone")}
                <br />
                {t("terms.section8.contact.address")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
