import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-accent">
                <i className="ri-verified-badge-fill text-2xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">{t('footer.title')}</h3>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-400 hover:text-white">{t('nav.home')}</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-gray-400 hover:text-white">{t('nav.about')}</a>
                </Link>
              </li>
              <li>
                <Link href="/verify">
                  <a className="text-gray-400 hover:text-white">{t('nav.verify')}</a>
                </Link>
              </li>
              <li>
                <Link href="/apply">
                  <a className="text-gray-400 hover:text-white">{t('nav.apply')}</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-400 hover:text-white">{t('nav.contact')}</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms">
                  <a className="text-gray-400 hover:text-white">{t('footer.terms')}</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-gray-400 hover:text-white">{t('footer.privacy')}</a>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <a className="text-gray-400 hover:text-white">{t('footer.cookies')}</a>
                </Link>
              </li>
              <li>
                <Link href="/data-retention">
                  <a className="text-gray-400 hover:text-white">{t('footer.dataRetention')}</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <i className="ri-map-pin-line mt-1 text-gray-400"></i>
                <span className="text-gray-400">{t('footer.address')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="ri-phone-line text-gray-400"></i>
                <span className="text-gray-400">{t('footer.phone')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="ri-mail-line text-gray-400"></i>
                <span className="text-gray-400">{t('footer.email')}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
