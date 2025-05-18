import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import GeometricPattern from "@/components/shared/GeometricPattern";

const Privacy = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t("privacy.title")}</title>
        <meta name="description" content={t("meta.privacy.description")} />
        <meta property="og:title" content={t("privacy.title")} />
        <meta property="og:description" content={t("meta.privacy.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("privacy.title")}</h1>
            <p className="text-xl text-primary-100">{t("privacy.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className={`max-w-4xl mx-auto ${isRtl ? "rtl" : ""}`}>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-500 mb-8">
              {t("privacy.lastUpdated")}: {t("privacy.lastUpdatedDate")}
            </p>

            <h2>{t("privacy.introduction.title")}</h2>
            <p>{t("privacy.introduction.content1")}</p>
            <p>{t("privacy.introduction.content2")}</p>

            <h2>{t("privacy.collection.title")}</h2>
            <p>{t("privacy.collection.content")}</p>
            <h3>{t("privacy.collection.personal.title")}</h3>
            <ul>
              <li>{t("privacy.collection.personal.item1")}</li>
              <li>{t("privacy.collection.personal.item2")}</li>
              <li>{t("privacy.collection.personal.item3")}</li>
              <li>{t("privacy.collection.personal.item4")}</li>
              <li>{t("privacy.collection.personal.item5")}</li>
            </ul>
            <h3>{t("privacy.collection.business.title")}</h3>
            <ul>
              <li>{t("privacy.collection.business.item1")}</li>
              <li>{t("privacy.collection.business.item2")}</li>
              <li>{t("privacy.collection.business.item3")}</li>
              <li>{t("privacy.collection.business.item4")}</li>
            </ul>

            <h2>{t("privacy.use.title")}</h2>
            <p>{t("privacy.use.content")}</p>
            <ul>
              <li>{t("privacy.use.item1")}</li>
              <li>{t("privacy.use.item2")}</li>
              <li>{t("privacy.use.item3")}</li>
              <li>{t("privacy.use.item4")}</li>
              <li>{t("privacy.use.item5")}</li>
              <li>{t("privacy.use.item6")}</li>
            </ul>

            <h2>{t("privacy.disclosure.title")}</h2>
            <p>{t("privacy.disclosure.content")}</p>
            <ul>
              <li>{t("privacy.disclosure.item1")}</li>
              <li>{t("privacy.disclosure.item2")}</li>
              <li>{t("privacy.disclosure.item3")}</li>
            </ul>

            <h2>{t("privacy.cookies.title")}</h2>
            <p>{t("privacy.cookies.content1")}</p>
            <p>{t("privacy.cookies.content2")}</p>

            <h2>{t("privacy.retention.title")}</h2>
            <p>{t("privacy.retention.content1")}</p>
            <p>{t("privacy.retention.content2")}</p>

            <h2>{t("privacy.security.title")}</h2>
            <p>{t("privacy.security.content1")}</p>
            <p>{t("privacy.security.content2")}</p>

            <h2>{t("privacy.rights.title")}</h2>
            <p>{t("privacy.rights.content")}</p>
            <ul>
              <li>{t("privacy.rights.item1")}</li>
              <li>{t("privacy.rights.item2")}</li>
              <li>{t("privacy.rights.item3")}</li>
              <li>{t("privacy.rights.item4")}</li>
              <li>{t("privacy.rights.item5")}</li>
            </ul>

            <h2>{t("privacy.changes.title")}</h2>
            <p>{t("privacy.changes.content")}</p>

            <h2>{t("privacy.contact.title")}</h2>
            <p>{t("privacy.contact.content")}</p>
            <ul>
              <li>
                <strong>{t("privacy.contact.email.label")}</strong>: {t("privacy.contact.email.value")}
              </li>
              <li>
                <strong>{t("privacy.contact.phone.label")}</strong>: {t("privacy.contact.phone.value")}
              </li>
              <li>
                <strong>{t("privacy.contact.address.label")}</strong>: {t("privacy.contact.address.value")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
