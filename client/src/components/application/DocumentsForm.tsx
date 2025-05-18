import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApplicationFormData } from "./MultiStepForm";
import { Upload, FileText, X } from "lucide-react";

interface DocumentsFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DocumentsForm: React.FC<DocumentsFormProps> = ({ 
  formData, 
  updateFormData, 
  nextStep,
  prevStep 
}) => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ApplicationFormData) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData({ [field]: e.target.files[0] });
    }
  };

  const removeFile = (field: keyof ApplicationFormData) => {
    updateFormData({ [field]: null });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.businessLicense) {
      newErrors.businessLicense = t("validation.required");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      nextStep();
    }
  };

  const renderFileInput = (
    field: keyof ApplicationFormData,
    label: string,
    description: string,
    required: boolean = false
  ) => {
    const file = formData[field] as File | null;
    
    return (
      <div className="mb-6">
        <Label className="block text-gray-700 text-sm font-medium mb-2">
          {label} {required && "*"}
        </Label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        
        {file ? (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeFile(field)}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-md p-6 text-center ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary'}`}>
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium">{t("apply.dragDropFiles")}</p>
              <p className="text-xs text-gray-500 mb-3">{t("apply.orBrowse")}</p>
              <input
                type="file"
                id={field.toString()}
                className="hidden"
                onChange={(e) => handleFileChange(e, field)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor={field.toString()}>
                <Button 
                  type="button" 
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  {t("apply.browseFiles")}
                </Button>
              </label>
            </div>
          </div>
        )}
        
        {errors[field] && (
          <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={isRtl ? "rtl" : ""}>
      <div className="space-y-2">
        {renderFileInput(
          "businessLicense",
          t("apply.businessLicense"),
          t("apply.businessLicenseDescription"),
          true
        )}
        
        {renderFileInput(
          "floorPlan",
          t("apply.floorPlan"),
          t("apply.floorPlanDescription")
        )}
        
        {renderFileInput(
          "supplierCertificates",
          t("apply.supplierCertificates"),
          t("apply.supplierCertificatesDescription")
        )}
        
        {renderFileInput(
          "additionalDocuments",
          t("apply.additionalDocuments"),
          t("apply.additionalDocumentsDescription")
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="border-gray-300"
        >
          <i className="ri-arrow-left-line mr-1"></i> {t("common.back")}
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
          {t("common.next")} <i className="ri-arrow-right-line ml-1"></i>
        </Button>
      </div>
    </form>
  );
};

export default DocumentsForm;
