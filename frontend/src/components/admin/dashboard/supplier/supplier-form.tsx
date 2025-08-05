"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/dashboard/supplier/rich-text-editor";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import Image from "next/image";
import { Supplier } from "@/types";
import { toast } from "sonner";

interface SupplierFormData {
  name: string;
  description: string;
  installation: string;
  phone: string;
  email: string;
  logo: File | undefined;
}

interface SupplierFormProps {
  onSupplierCreated: (supplier: Supplier) => void;
}

export function SupplierForm({ onSupplierCreated }: SupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installationContent, setInstallationContent] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);

  const { addSupplier } = useSuppliers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>();

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (installationContent) formData.append("installation", installationContent);
      if (data.phone) formData.append("phone", data.phone);
      if (data.email) formData.append("email", data.email);
      if (logoFile) formData.append("logo", logoFile);

      const supplier: Supplier = await addSupplier(formData);
      console.log(supplier);
      onSupplierCreated(supplier);
      
      // Reset form
      reset();
      setInstallationContent("");
      setLogoPreview(null);
      setLogoFile(undefined);
      
      // Show success toast
      toast.success("Supplier created successfully!", {
        description: `${data.name} has been added to your suppliers list.`,
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("Failed to create supplier", {
        description: "Please check your information and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setLogoPreview(fileUrl);
      setLogoFile(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(undefined);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Supplier Name *</Label>
          <Input
            id="name"
            {...register("name", { required: "Supplier name is required" })}
            placeholder="Enter supplier name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            placeholder="supplier@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="logo">Company Logo</Label>
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 bg-amber-50/50">
            {!logoPreview ? (
              <div className="text-center">
                <Upload className="mx-auto h-16 w-16 text-amber-400" />
                <div className="mt-4">
                  <label
                    htmlFor="logo"
                    className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md hover:from-amber-600 hover:to-orange-700 transition-all font-medium"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Company Logo
                  </label>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  PNG, JPG, SVG up to 10MB. Recommended: 200x200px
                </p>
              </div>
            ) : (
              <div className="relative flex justify-center">
                <div className="relative">
                  <Image
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-48 h-48 object-contain rounded-lg bg-white border border-gray-200"
                    height={192}
                    width={192}
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Brief description of the supplier, their expertise, and services offered..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>Installation Instructions</Label>
          <div className="border border-amber-200 rounded-lg p-1 bg-white">
            <RichTextEditor
              content={installationContent}
              onChange={setInstallationContent}
              placeholder="Enter detailed installation instructions, guidelines, and best practices..."
            />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-3"
      >
        {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        <Plus className="w-5 h-5 mr-2" />
        Create Supplier
      </Button>
    </form>
  );
}
