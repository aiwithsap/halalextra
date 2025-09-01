import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { ApplicationFormData } from "./MultiStepForm";

interface BusinessInfoFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
}

const BusinessInfoForm: React.FC<BusinessInfoFormProps> = ({ 
  formData, 
  updateFormData, 
  nextStep 
}) => {
  const { t } = useTranslation();
  // Use document direction instead of context
  const isRtl = document.documentElement.dir === "rtl";
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    updateFormData({ [name]: value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = t("validation.required");
    }
    
    if (!formData.businessType) {
      newErrors.businessType = t("validation.required");
    }
    
    if (!formData.abn.trim()) {
      newErrors.abn = t("validation.required");
    } else if (!/^\d{11}$/.test(formData.abn.replace(/\s/g, ''))) {
      newErrors.abn = t("validation.invalidABN");
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t("validation.required");
    }
    
    if (!formData.city.trim()) {
      newErrors.city = t("validation.required");
    }
    
    if (!formData.state) {
      newErrors.state = t("validation.required");
    }
    
    if (!formData.postcode.trim()) {
      newErrors.postcode = t("validation.required");
    } else if (!/^\d{4}$/.test(formData.postcode)) {
      newErrors.postcode = t("validation.invalidPostcode");
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

  return (
    <form onSubmit={handleSubmit} className={isRtl ? "rtl" : ""}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="businessName" className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.businessName")} *
          </Label>
          <Input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            className={`w-full border ${errors.businessName ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.businessName && (
            <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="businessType" className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.businessType")} *
          </Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => handleSelectChange("businessType", value)}
          >
            <SelectTrigger id="businessType" className={`w-full border ${errors.businessType ? 'border-red-500' : 'border-gray-300'}`}>
              <SelectValue placeholder={t("apply.form.selectBusinessType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="restaurant">{t("apply.form.businessTypes.restaurant")}</SelectItem>
                <SelectItem value="cafe">{t("apply.form.businessTypes.cafe")}</SelectItem>
                <SelectItem value="food-manufacturer">{t("apply.form.businessTypes.foodManufacturer")}</SelectItem>
                <SelectItem value="grocery">{t("apply.form.businessTypes.grocery")}</SelectItem>
                <SelectItem value="other">{t("apply.form.businessTypes.other")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.businessType && (
            <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="abn" className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.abn")} *
          </Label>
          <Input
            type="text"
            id="abn"
            name="abn"
            value={formData.abn}
            onChange={handleChange}
            className={`w-full border ${errors.abn ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.abn && (
            <p className="text-red-500 text-xs mt-1">{errors.abn}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="established" className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.established")}
          </Label>
          <Input
            type="number"
            id="established"
            name="established"
            value={formData.established}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear()}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.address")} *
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary mb-2`}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
          )}
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                id="city"
                name="city"
                placeholder={t("apply.form.city")}
                value={formData.city}
                onChange={handleChange}
                className={`w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <Select
                value={formData.state}
                onValueChange={(value) => handleSelectChange("state", value)}
              >
                <SelectTrigger id="state" className={`w-full border ${errors.state ? 'border-red-500' : 'border-gray-300'}`}>
                  <SelectValue placeholder={t("apply.form.selectState")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="NSW">NSW</SelectItem>
                    <SelectItem value="VIC">VIC</SelectItem>
                    <SelectItem value="QLD">QLD</SelectItem>
                    <SelectItem value="WA">WA</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                    <SelectItem value="TAS">TAS</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="NT">NT</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>
            <div>
              <Input
                type="text"
                id="postcode"
                name="postcode"
                placeholder={t("apply.form.postcode")}
                value={formData.postcode}
                onChange={handleChange}
                className={`w-full border ${errors.postcode ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.postcode && (
                <p className="text-red-500 text-xs mt-1">{errors.postcode}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
          {t("common.next")} <i className="ri-arrow-right-line ml-1"></i>
        </Button>
      </div>
    </form>
  );
};

export default BusinessInfoForm;
