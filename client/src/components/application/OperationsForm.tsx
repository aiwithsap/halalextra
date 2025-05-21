import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationFormData } from "./MultiStepForm";
import { Plus, Trash2 } from "lucide-react";

interface OperationsFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const OperationsForm: React.FC<OperationsFormProps> = ({ 
  formData, 
  updateFormData, 
  nextStep,
  prevStep 
}) => {
  const { t } = useTranslation();
  // Use document direction instead of context
  const isRtl = document.documentElement.dir === "rtl";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    material: "",
    certified: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleAddProduct = () => {
    if (newProduct.trim()) {
      const updatedProducts = [...formData.products, newProduct.trim()];
      updateFormData({ products: updatedProducts });
      setNewProduct("");
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    updateFormData({ products: updatedProducts });
  };

  const handleAddSupplier = () => {
    if (newSupplier.name.trim() && newSupplier.material.trim()) {
      const updatedSuppliers = [...formData.suppliers, { ...newSupplier }];
      updateFormData({ suppliers: updatedSuppliers });
      setNewSupplier({
        name: "",
        material: "",
        certified: false
      });
    }
  };

  const handleRemoveSupplier = (index: number) => {
    const updatedSuppliers = formData.suppliers.filter((_, i) => i !== index);
    updateFormData({ suppliers: updatedSuppliers });
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

  return (
    <form onSubmit={handleSubmit} className={isRtl ? "rtl" : ""}>
      <div className="space-y-6">
        <div>
          <Label className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.operations.products")} *
          </Label>
          <p className="text-sm text-gray-500 mb-2">{t("apply.form.operations.productsDescription")}</p>
          
          <div className="mb-2">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder={t("apply.form.operations.productPlaceholder")}
                className="w-full border border-gray-300 rounded-md"
              />
              <Button 
                type="button" 
                onClick={handleAddProduct}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {formData.products.length > 0 ? (
            <div className="space-y-2 mt-3">
              {formData.products.map((product, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span>{product}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveProduct(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">{t("apply.form.operations.noProductsAdded")}</div>
          )}
          
          {errors.products && (
            <p className="text-red-500 text-xs mt-1">{errors.products}</p>
          )}
        </div>
        
        <div>
          <Label className="block text-gray-700 text-sm font-medium mb-2">
            {t("apply.form.operations.suppliers")} *
          </Label>
          <p className="text-sm text-gray-500 mb-2">{t("apply.form.operations.suppliersDescription")}</p>
          
          <div className="mb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="text"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                placeholder={t("apply.form.operations.supplierName")}
                className="border border-gray-300 rounded-md"
              />
              <Input
                type="text"
                value={newSupplier.material}
                onChange={(e) => setNewSupplier({...newSupplier, material: e.target.value})}
                placeholder={t("apply.form.operations.supplierMaterial")}
                className="border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="supplierCertified"
                checked={newSupplier.certified}
                onCheckedChange={(checked) => 
                  setNewSupplier({...newSupplier, certified: checked as boolean})
                }
              />
              <Label htmlFor="supplierCertified" className="text-sm font-normal">
                {t("apply.form.operations.supplierCertified")}
              </Label>
            </div>
            <Button 
              type="button" 
              onClick={handleAddSupplier}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("apply.form.operations.addSupplier")}
            </Button>
          </div>
          
          {formData.suppliers.length > 0 ? (
            <div className="space-y-2 mt-3">
              {formData.suppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div>
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-sm text-gray-500">{supplier.material}</div>
                    <div className="text-xs">
                      {supplier.certified ? (
                        <span className="text-success">{t("apply.form.operations.certified")}</span>
                      ) : (
                        <span className="text-gray-500">{t("apply.form.operations.notCertified")}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveSupplier(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">{t("apply.form.operations.noSuppliersAdded")}</div>
          )}
          
          {errors.suppliers && (
            <p className="text-red-500 text-xs mt-1">{errors.suppliers}</p>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="employeeCount" className="block text-gray-700 text-sm font-medium mb-2">
              {t("apply.form.operations.employeeCount")} *
            </Label>
            <Input
              type="number"
              id="employeeCount"
              name="employeeCount"
              value={formData.employeeCount}
              onChange={handleChange}
              min="1"
              className={`w-full border ${errors.employeeCount ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {errors.employeeCount && (
              <p className="text-red-500 text-xs mt-1">{errors.employeeCount}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="operatingHours" className="block text-gray-700 text-sm font-medium mb-2">
              {t("apply.form.operations.operatingHours")} *
            </Label>
            <Input
              type="text"
              id="operatingHours"
              name="operatingHours"
              value={formData.operatingHours}
              onChange={handleChange}
              placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-3pm"
              className={`w-full border ${errors.operatingHours ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {errors.operatingHours && (
              <p className="text-red-500 text-xs mt-1">{errors.operatingHours}</p>
            )}
          </div>
        </div>
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

export default OperationsForm;
