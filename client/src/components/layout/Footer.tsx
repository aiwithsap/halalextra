import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Halal Certification</h3>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Ensuring authenticity and compliance with Islamic dietary laws
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Home</Button>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">About</Button>
                </Link>
              </li>
              <li>
                <Link href="/verify">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Verify</Button>
                </Link>
              </li>
              <li>
                <Link href="/apply">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Apply</Button>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Contact</Button>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Terms of Service</Button>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <Button variant="link" className="text-gray-400 hover:text-white p-0">Privacy Policy</Button>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-gray-400">123 Certification Ave, Suite 101<br/>New York, NY 10001</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-400">info@halalcert.org</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Halal Certification Authority. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
