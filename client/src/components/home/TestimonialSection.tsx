import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import GeometricPattern from "@/components/shared/GeometricPattern";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialProps {
  rating: number;
  content: string;
  authorInitials: string;
  authorName: string;
  authorBusiness: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ 
  rating, 
  content, 
  authorInitials, 
  authorName, 
  authorBusiness 
}) => {
  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <i 
                key={i} 
                className={`ri-star-${i < rating ? 'fill' : i === Math.floor(rating) && rating % 1 !== 0 ? 'half-fill' : 'fill'}`}
              ></i>
            ))}
          </div>
        </div>
        <p className="text-gray-700 mb-4">{content}</p>
        <div className="flex items-center mt-4">
          <div className="mr-3 flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">{authorInitials}</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium">{authorName}</h4>
            <p className="text-sm text-gray-500">{authorBusiness}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TestimonialSection = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  const testimonials = [
    {
      rating: 5,
      content: t("testimonials.content1"),
      authorInitials: "AK",
      authorName: t("testimonials.author1"),
      authorBusiness: t("testimonials.business1")
    },
    {
      rating: 4.5,
      content: t("testimonials.content2"),
      authorInitials: "JR",
      authorName: t("testimonials.author2"),
      authorBusiness: t("testimonials.business2")
    },
    {
      rating: 5,
      content: t("testimonials.content3"),
      authorInitials: "SM",
      authorName: t("testimonials.author3"),
      authorBusiness: t("testimonials.business3")
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary-50 relative overflow-hidden">
      <GeometricPattern className="absolute inset-0 opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("testimonials.title")}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            {t("testimonials.description")}
          </p>
        </div>
        
        <div className={`grid md:grid-cols-3 gap-6 ${isRtl ? "rtl" : ""}`}>
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              rating={testimonial.rating}
              content={testimonial.content}
              authorInitials={testimonial.authorInitials}
              authorName={testimonial.authorName}
              authorBusiness={testimonial.authorBusiness}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
