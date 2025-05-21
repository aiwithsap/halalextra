import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  // Use document direction instead of context
  const isRtl = document.documentElement.dir === "rtl";
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
    // All fields in step 2 onwards are optional
    const newErrors: Record<string, string> = {};
    setErrors(newErrors);
    return true;
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
              <p className="text-sm font-medium">Drag and drop files here</p>
              <p className="text-xs text-gray-500 mb-3">or browse your computer</p>
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
                  Browse Files
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
          "Business License",
          "Upload a copy of your valid business license or registration certificate",
          true
        )}
        
        {renderFileInput(
          "floorPlan",
          "Floor Plan",
          "Provide a layout of your facility showing food preparation, storage, and serving areas"
        )}
        
        {renderFileInput(
          "supplierCertificates",
          "Supplier Certificates",
          "Upload Halal certificates from your major ingredient suppliers if available"
        )}
        
        {renderFileInput(
          "additionalDocuments",
          "Additional Documents",
          "Any other relevant documentation that might support your application"
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
