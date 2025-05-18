import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BusinessInfoForm from "./BusinessInfoForm";
import OperationsForm from "./OperationsForm";
import DocumentsForm from "./DocumentsForm";
import ConfirmationForm from "./ConfirmationForm";

// Define the application form data structure
export interface ApplicationFormData {
  // Business Info
  businessName: string;
  businessType: string;
  abn: string;
  established: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  
  // Operations
  products: string[];
  suppliers: { name: string; material: string; certified: boolean }[];
  employeeCount: string;
  operatingHours: string;
  
  // Documents
  businessLicense: File | null;
  floorPlan: File | null;
  supplierCertificates: File | null;
  additionalDocuments: File | null;
  
  // Contact info
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  termsAccepted: boolean;
}

const MultiStepForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    businessName: "",
    businessType: "",
    abn: "",
    established: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    
    products: [],
    suppliers: [],
    employeeCount: "",
    operatingHours: "",
    
    businessLicense: null,
    floorPlan: null,
    supplierCertificates: null,
    additionalDocuments: null,
    
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    termsAccepted: false
  });

  const updateFormData = (stepData: Partial<ApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create FormData object for file uploads
      const formDataObj = new FormData();
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'suppliers') {
          formDataObj.append(key, JSON.stringify(value));
        } else if (key === 'products') {
          formDataObj.append(key, JSON.stringify(value));
        } else if (
          key !== 'businessLicense' && 
          key !== 'floorPlan' && 
          key !== 'supplierCertificates' && 
          key !== 'additionalDocuments'
        ) {
          formDataObj.append(key, String(value));
        }
      });
      
      // Add files if they exist
      if (formData.businessLicense) {
        formDataObj.append('businessLicense', formData.businessLicense);
      }
      if (formData.floorPlan) {
        formDataObj.append('floorPlan', formData.floorPlan);
      }
      if (formData.supplierCertificates) {
        formDataObj.append('supplierCertificates', formData.supplierCertificates);
      }
      if (formData.additionalDocuments) {
        formDataObj.append('additionalDocuments', formData.additionalDocuments);
      }
      
      // Submit application to our API which will now use PostgreSQL storage
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataObj,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: t("apply.successTitle"),
        description: t("apply.successMessage") + (result.applicationId ? ` (ID: ${result.applicationId})` : ''),
      });
      
      // Reset form and go back to step 1
      setFormData({
        businessName: "",
        businessType: "",
        abn: "",
        established: "",
        address: "",
        city: "",
        state: "",
        postcode: "",
        
        products: [],
        suppliers: [],
        employeeCount: "",
        operatingHours: "",
        
        businessLicense: null,
        floorPlan: null,
        supplierCertificates: null,
        additionalDocuments: null,
        
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        termsAccepted: false
      });
      setCurrentStep(1);
      
    } catch (error) {
      console.error("Error submitting application:", error);
      const errorMessage = error instanceof Error ? error.message : t("apply.errorMessage");
      toast({
        title: t("apply.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl">{t("apply.formTitle")}</h3>
        <span className="text-sm text-gray-500">* {t("apply.requiredFields")}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative pt-1 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${
              currentStep >= 1 ? "bg-primary" : "bg-gray-200 text-gray-700"
            }`}>1</div>
            <span className="text-sm font-medium mt-1">{t("apply.step1Short")}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${
              currentStep >= 2 ? "bg-primary" : "bg-gray-200 text-gray-700"
            }`}>2</div>
            <span className="text-sm font-medium mt-1">{t("apply.step2Short")}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${
              currentStep >= 3 ? "bg-primary" : "bg-gray-200 text-gray-700"
            }`}>3</div>
            <span className="text-sm font-medium mt-1">{t("apply.step3Short")}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${
              currentStep >= 4 ? "bg-primary" : "bg-gray-200 text-gray-700"
            }`}>4</div>
            <span className="text-sm font-medium mt-1">{t("apply.step4Short")}</span>
          </div>
        </div>
        <div className="absolute left-0 top-5 h-1 bg-gray-200 w-full -z-10"></div>
        <div 
          className="absolute left-0 top-5 h-1 bg-primary -z-10"
          style={{ width: `${(currentStep - 1) / 3 * 100}%` }}
        ></div>
      </div>
      
      <div className="multi-step-form">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
          <BusinessInfoForm 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep}
          />
        </div>
        
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
          <OperationsForm 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
            prevStep={prevStep}
          />
        </div>
        
        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>
          <DocumentsForm 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
            prevStep={prevStep}
          />
        </div>
        
        <div className={`step ${currentStep === 4 ? 'active' : ''}`}>
          <ConfirmationForm 
            formData={formData} 
            updateFormData={updateFormData} 
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
