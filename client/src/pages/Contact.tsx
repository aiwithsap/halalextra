import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { MapPin, Phone, Mail } from "lucide-react";
import GeometricPattern from "@/components/shared/GeometricPattern";

const Contact = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, we would send this data to an API
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t("contact.success"),
        description: t("contact.successMessage"),
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("contact.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("meta.contact.title")}</title>
        <meta name="description" content={t("meta.contact.description")} />
        <meta property="og:title" content={t("meta.contact.title")} />
        <meta property="og:description" content={t("meta.contact.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("contact.title")}</h1>
            <p className="text-xl text-primary-100">{t("contact.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className={`max-w-5xl mx-auto ${isRtl ? "rtl" : ""}`}>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("contact.getInTouch")}</h2>
              <p className="text-gray-600 mb-8">{t("contact.getInTouchDescription")}</p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t("contact.address")}</h3>
                    <p className="text-gray-600">{t("contact.addressValue")}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t("contact.phone")}</h3>
                    <p className="text-gray-600">{t("contact.phoneValue")}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t("contact.email")}</h3>
                    <p className="text-gray-600">{t("contact.emailValue")}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12">
                <h3 className="font-bold text-lg mb-4">{t("contact.officeHours")}</h3>
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.monday")}</td>
                      <td className="py-2">{t("contact.workHours")}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.tuesday")}</td>
                      <td className="py-2">{t("contact.workHours")}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.wednesday")}</td>
                      <td className="py-2">{t("contact.workHours")}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.thursday")}</td>
                      <td className="py-2">{t("contact.workHours")}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.friday")}</td>
                      <td className="py-2">{t("contact.workHours")}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">{t("contact.saturday")}</td>
                      <td className="py-2">{t("contact.satHours")}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">{t("contact.sunday")}</td>
                      <td className="py-2">{t("contact.closed")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("contact.contactForm")}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="block mb-2">{t("contact.name")}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="block mb-2">{t("contact.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject" className="block mb-2">{t("contact.subject")}</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={handleSelectChange}
                    required
                  >
                    <SelectTrigger id="subject" className="w-full">
                      <SelectValue placeholder={t("contact.selectSubject")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certification">{t("contact.subjects.certification")}</SelectItem>
                      <SelectItem value="inspection">{t("contact.subjects.inspection")}</SelectItem>
                      <SelectItem value="verification">{t("contact.subjects.verification")}</SelectItem>
                      <SelectItem value="feedback">{t("contact.subjects.feedback")}</SelectItem>
                      <SelectItem value="other">{t("contact.subjects.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message" className="block mb-2">{t("contact.message")}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full min-h-[150px]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("common.sending")}
                    </>
                  ) : t("contact.send")}
                </Button>
              </form>
            </div>
          </div>
          
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t("contact.findUs")}</h2>
            <div className="bg-gray-200 h-96 rounded-lg overflow-hidden">
              {/* Embedding a map using an iframe */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26537.82356478194!2d151.20769861542967!3d-33.873207999999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12ae401e8b983f%3A0x5017d681632ccc0!2sSydney%20NSW%202000%2C%20Australia!5e0!3m2!1sen!2sus!4v1651234567890!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
