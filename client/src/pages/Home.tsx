import { useTranslation } from "react-i18next";
import HeroSection from "@/components/home/HeroSection";
import VerificationSection from "@/components/home/VerificationSection";
import ApplicationSection from "@/components/home/ApplicationSection";
import InspectorDashboardPreview from "@/components/home/InspectorDashboardPreview";
import TestimonialSection from "@/components/home/TestimonialSection";
import CTASection from "@/components/home/CTASection";
import { Helmet } from "react-helmet";

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t("meta.home.title")}</title>
        <meta name="description" content={t("meta.home.description")} />
        <meta property="og:title" content={t("meta.home.title")} />
        <meta property="og:description" content={t("meta.home.description")} />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <HeroSection />
      <VerificationSection />
      <ApplicationSection />
      <InspectorDashboardPreview />
      <TestimonialSection />
      <CTASection />
    </>
  );
};

export default Home;
