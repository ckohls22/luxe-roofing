"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/dashboard/supplier/rich-text-editor";
import { Loader2 } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";

interface SupplierFormData {
  name: string;
  description: string;
  installation: string;
  phone: string;
  email: string;
  logo: File | undefined;
}

interface SupplierFormProps {
  onSupplierCreated: (supplier: any) => void;
}

export function SupplierForm({ onSupplierCreated }: SupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installationContent, setInstallationContent] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { addSupplier, loading } = useSuppliers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SupplierFormData>();

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);

    // Simulate API call
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("installation", installationContent);
      formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("logo", data.logo as File);

      const supplier = await addSupplier(formData);
      setIsSubmitting(false);
      onSupplierCreated(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              id="logo"
              accept="image/*"
              {...(register("logo"),
              {
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                    setValue("logo", file);
                  } else {
                    setLogoPreview(null);
                    setValue("logo", undefined);
                  }
                },
              })}
              placeholder="https://example.com/logo.png"
            />

            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-32 h-32 object-contain rounded border ml-2"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of the supplier"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Installation Instructions</Label>
        <RichTextEditor
          content={installationContent}
          onChange={setInstallationContent}
          placeholder="Enter detailed installation instructions..."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Supplier
      </Button>
    </form>
  );
}
