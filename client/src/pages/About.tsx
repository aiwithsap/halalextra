import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import GeometricPattern from "@/components/shared/GeometricPattern";

const About = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t("meta.about.title")}</title>
        <meta name="description" content={t("meta.about.description")} />
        <meta property="og:title" content={t("meta.about.title")} />
        <meta property="og:description" content={t("meta.about.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("about.title")}</h1>
            <p className="text-xl text-primary-100">{t("about.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className={`max-w-4xl mx-auto ${isRtl ? "rtl" : ""}`}>
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">{t("about.mission.title")}</h2>
            <p className="text-lg text-gray-700 mb-6">{t("about.mission.description1")}</p>
            <p className="text-lg text-gray-700 mb-6">{t("about.mission.description2")}</p>
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              <div className="bg-secondary-50 p-6 rounded-lg">
                <div className="text-primary text-2xl mb-3">
                  <i className="ri-check-double-line"></i>
                </div>
                <h3 className="font-bold text-xl mb-2">{t("about.values.integrity")}</h3>
                <p className="text-gray-600">{t("about.values.integrityDesc")}</p>
              </div>
              <div className="bg-secondary-50 p-6 rounded-lg">
                <div className="text-primary text-2xl mb-3">
                  <i className="ri-shield-check-line"></i>
                </div>
                <h3 className="font-bold text-xl mb-2">{t("about.values.trust")}</h3>
                <p className="text-gray-600">{t("about.values.trustDesc")}</p>
              </div>
              <div className="bg-secondary-50 p-6 rounded-lg">
                <div className="text-primary text-2xl mb-3">
                  <i className="ri-eye-line"></i>
                </div>
                <h3 className="font-bold text-xl mb-2">{t("about.values.transparency")}</h3>
                <p className="text-gray-600">{t("about.values.transparencyDesc")}</p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">{t("about.process.title")}</h2>
            <ol className="relative border-l border-gray-200 ml-3 space-y-8">
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full -left-4">
                  1
                </span>
                <h3 className="font-bold text-xl mb-2">{t("about.process.application")}</h3>
                <p className="text-gray-600 mb-4">{t("about.process.applicationDesc")}</p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full -left-4">
                  2
                </span>
                <h3 className="font-bold text-xl mb-2">{t("about.process.review")}</h3>
                <p className="text-gray-600 mb-4">{t("about.process.reviewDesc")}</p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full -left-4">
                  3
                </span>
                <h3 className="font-bold text-xl mb-2">{t("about.process.inspection")}</h3>
                <p className="text-gray-600 mb-4">{t("about.process.inspectionDesc")}</p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full -left-4">
                  4
                </span>
                <h3 className="font-bold text-xl mb-2">{t("about.process.certification")}</h3>
                <p className="text-gray-600 mb-4">{t("about.process.certificationDesc")}</p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full -left-4">
                  5
                </span>
                <h3 className="font-bold text-xl mb-2">{t("about.process.monitoring")}</h3>
                <p className="text-gray-600 mb-4">{t("about.process.monitoringDesc")}</p>
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">{t("about.team.title")}</h2>
            <p className="text-lg text-gray-700 mb-10">{t("about.team.description")}</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-gray-400">
                  <i className="ri-user-3-line text-4xl"></i>
                </div>
                <h3 className="font-bold text-xl">{t("about.team.member1.name")}</h3>
                <p className="text-primary mb-2">{t("about.team.member1.role")}</p>
                <p className="text-gray-600">{t("about.team.member1.bio")}</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-gray-400">
                  <i className="ri-user-3-line text-4xl"></i>
                </div>
                <h3 className="font-bold text-xl">{t("about.team.member2.name")}</h3>
                <p className="text-primary mb-2">{t("about.team.member2.role")}</p>
                <p className="text-gray-600">{t("about.team.member2.bio")}</p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">{t("about.faq.title")}</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-xl mb-3">{t("about.faq.q1")}</h3>
                <p className="text-gray-600">{t("about.faq.a1")}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-xl mb-3">{t("about.faq.q2")}</h3>
                <p className="text-gray-600">{t("about.faq.a2")}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-xl mb-3">{t("about.faq.q3")}</h3>
                <p className="text-gray-600">{t("about.faq.a3")}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-xl mb-3">{t("about.faq.q4")}</h3>
                <p className="text-gray-600">{t("about.faq.a4")}</p>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Link href="/apply">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
                {t("about.applyNow")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
