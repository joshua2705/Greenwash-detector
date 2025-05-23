
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Building2, Globe, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  companyName: string;
  companyWebsite: string;
  additionalDetails: string;
  companyDocuments: File | null;
}

const CompanyForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companyWebsite: "",
    additionalDetails: "",
    companyDocuments: null,
  });
  const [errors, setErrors] = useState<{ companyName?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      companyDocuments: file,
    }));
  };

  const validateForm = () => {
    const newErrors: { companyName?: string } = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare the payload
      const payload = {
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite,
        additionalDetails: formData.additionalDetails,
        hasDocuments: !!formData.companyDocuments,
        documentName: formData.companyDocuments?.name || null,
        timestamp: new Date().toISOString(),
      };

      console.log("API Payload:", payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Analysis Started",
        description: `Successfully submitted analysis request for ${formData.companyName}`,
      });
      
      // Reset form after successful submission
      setFormData({
        companyName: "",
        companyWebsite: "",
        additionalDetails: "",
        companyDocuments: null,
      });
      
      // Reset file input
      const fileInput = document.getElementById("company-documents") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit analysis request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-green-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
        <CardTitle className="text-2xl text-green-800 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Company Analysis Form
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-green-700 font-medium">
              Company Name *
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              className={`border-green-200 focus:border-green-400 focus:ring-green-400 ${
                errors.companyName ? "border-red-400" : ""
              }`}
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm">{errors.companyName}</p>
            )}
          </div>

          {/* Company Documents */}
          <div className="space-y-2">
            <Label htmlFor="company-documents" className="text-green-700 font-medium">
              Company Documents
            </Label>
            <div className="relative">
              <Input
                id="company-documents"
                name="companyDocuments"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.csv"
                className="border-green-200 focus:border-green-400 focus:ring-green-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
            </div>
            <p className="text-sm text-gray-500">
              Upload relevant company documents (PDF, DOC, TXT, CSV)
            </p>
            {formData.companyDocuments && (
              <p className="text-sm text-green-600">
                Selected: {formData.companyDocuments.name}
              </p>
            )}
          </div>

          {/* Company Website */}
          <div className="space-y-2">
            <Label htmlFor="companyWebsite" className="text-green-700 font-medium">
              Company Website
            </Label>
            <div className="relative">
              <Input
                id="companyWebsite"
                name="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="border-green-200 focus:border-green-400 focus:ring-green-400 pl-10"
              />
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="additionalDetails" className="text-green-700 font-medium">
              Additional Company Details
            </Label>
            <div className="relative">
              <Textarea
                id="additionalDetails"
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleInputChange}
                placeholder="Provide any additional information about the company..."
                rows={4}
                className="border-green-200 focus:border-green-400 focus:ring-green-400 pl-10"
              />
              <FileText className="absolute left-3 top-3 w-4 h-4 text-green-500" />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Company...
              </>
            ) : (
              "Analyze Company"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanyForm;
