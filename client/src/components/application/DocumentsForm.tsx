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

  // Client-side file validation - BUG FIX #1
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedExtensions = ['.pdf', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File type not allowed. Accepted: PDF, TXT, JPG, PNG, DOC, DOCX`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ApplicationFormData) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateFile(file);

      if (!validation.valid) {
        setErrors({ ...errors, [field]: validation.error || 'Invalid file' });
        return;
      }

      // Clear any previous errors for this field
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);

      updateFormData({ [field]: file });
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
    
    // Handle drag and drop events
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = e.currentTarget;
      dropzone.classList.add('border-primary', 'bg-primary/5');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = e.currentTarget;
      dropzone.classList.remove('border-primary', 'bg-primary/5');
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = e.currentTarget;
      dropzone.classList.remove('border-primary', 'bg-primary/5');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        const validation = validateFile(droppedFile);

        if (!validation.valid) {
          setErrors({ ...errors, [field]: validation.error || 'Invalid file' });
          return;
        }

        // Clear any previous errors for this field
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);

        updateFormData({ [field]: droppedFile });
      }
    };
    
    const triggerFileInput = () => {
      const fileInput = document.getElementById(field.toString()) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    };
    
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
          <div 
            className={`border-2 border-dashed rounded-md p-6 text-center ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary'} transition-colors cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium">Drag and drop files here</p>
              <p className="text-xs text-gray-500 mb-3">or browse your computer</p>
              <input
                type="file"
                id={field.toString()}
                className="hidden"
                onChange={(e) => handleFileChange(e, field)}
                accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,.doc,.docx"
              />
              <p className="text-xs text-gray-500 mt-2">
                Accepted formats: PDF, TXT, JPG, PNG, WEBP, DOC, DOCX (Max 10MB)
              </p>
              <Button 
                type="button" 
                variant="outline"
                className="text-primary border-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                Browse Files
              </Button>
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
