import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Halal Certification Authority</title>
        <meta name="description" content="We provide trusted and reliable Halal certification services to ensure compliance with Islamic dietary laws. Apply for certification or verify Halal certificates." />
      </Helmet>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Trusted Halal Certification
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Ensuring authenticity and compliance with Islamic dietary laws for businesses worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Apply for Certification
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Verify Certificate
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Certification Process</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Application</h3>
              <p className="text-gray-600">Submit your business information and documents</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Review</h3>
              <p className="text-gray-600">Our experts evaluate your application materials</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Inspection</h3>
              <p className="text-gray-600">On-site evaluation by qualified inspectors</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Certification</h3>
              <p className="text-gray-600">Receive your certificate and QR verification code</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Certified?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of businesses worldwide who trust our certification process to verify their commitment to halal standards.
          </p>
          <Link href="/apply">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Your Application
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
