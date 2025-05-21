import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationFormData } from "./MultiStepForm";
import { Separator } from "@/components/ui/separator";

interface ConfirmationFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  prevStep: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

const ConfirmationForm: React.FC<ConfirmationFormProps> = ({ 
  formData, 
  updateFormData, 
  prevStep,
  handleSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation();
  // Use document direction instead of context
  const isRtl = document.documentElement.dir === "rtl";
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate email format if one is provided
    if (formData.ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = t("validation.invalidEmail");
    }
    
    // Only validate terms acceptance
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = t("validation.acceptTerms");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className={isRtl ? "rtl" : ""}>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">{t("apply.contactInformation")}</h3>
          <p className="text-sm text-gray-500 mb-4">{t("apply.contactInformationDescription")}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="ownerName" className="block text-gray-700 text-sm font-medium mb-2">
                {t("apply.ownerName")} *
              </Label>
              <Input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className={`w-full border ${errors.ownerName ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.ownerName && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="ownerEmail" className="block text-gray-700 text-sm font-medium mb-2">
                {t("apply.ownerEmail")} *
              </Label>
              <Input
                type="email"
                id="ownerEmail"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className={`w-full border ${errors.ownerEmail ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.ownerEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerEmail}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="ownerPhone" className="block text-gray-700 text-sm font-medium mb-2">
                {t("apply.ownerPhone")} *
              </Label>
              <Input
                type="tel"
                id="ownerPhone"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                className={`w-full border ${errors.ownerPhone ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.ownerPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerPhone}</p>
              )}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-semibold text-lg mb-2">{t("apply.applicationSummary")}</h3>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="font-medium">{formData.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-medium">
                  {formData.businessType === "restaurant" && "Restaurant"}
                  {formData.businessType === "cafe" && "Cafe"}
                  {formData.businessType === "foodManufacturer" && "Food Manufacturer"}
                  {formData.businessType === "grocery" && "Grocery Store"}
                  {formData.businessType === "other" && "Other"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ABN (Australian Business Number)</p>
                <p className="font-medium">{formData.abn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{`${formData.address}, ${formData.city}, ${formData.state} ${formData.postcode}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Products</p>
                <p className="font-medium">{formData.products.join(", ")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Suppliers</p>
                <p className="font-medium">{formData.suppliers.map(s => s.name).join(", ")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Documents</p>
                <ul className="list-disc list-inside text-sm">
                  {formData.businessLicense && (
                    <li>Business License - {formData.businessLicense.name}</li>
                  )}
                  {formData.floorPlan && (
                    <li>Floor Plan - {formData.floorPlan.name}</li>
                  )}
                  {formData.supplierCertificates && (
                    <li>Supplier Certificates - {formData.supplierCertificates.name}</li>
                  )}
                  {formData.additionalDocuments && (
                    <li>Additional Documents - {formData.additionalDocuments.name}</li>
                  )}
                  {!formData.businessLicense && 
                   !formData.floorPlan && 
                   !formData.supplierCertificates && 
                   !formData.additionalDocuments && (
                    <li>No documents uploaded</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 mt-4">
            <Checkbox
              id="termsAccepted"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => 
                updateFormData({ termsAccepted: checked as boolean })
              }
              className={errors.termsAccepted ? 'border-red-500' : ''}
            />
            <div className="space-y-1">
              <Label 
                htmlFor="termsAccepted" 
                className={`text-sm font-normal ${errors.termsAccepted ? 'text-red-500' : ''}`}
              >
                I agree to the terms and conditions *
              </Label>
              {errors.termsAccepted && (
                <p className="text-red-500 text-xs">{errors.termsAccepted}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="border-gray-300"
          disabled={isSubmitting}
        >
          <i className="ri-arrow-left-line mr-1"></i> {t("common.back")}
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("common.submitting")}
            </>
          ) : (
            <>
              {t("common.submit")} <i className="ri-check-line ml-1"></i>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ConfirmationForm;
