"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { useMaterials } from "@/hooks/useMaterials";
import Image from "next/image";
import { Material } from "@/types";
import { toast } from "sonner";

interface MaterialFormData {
  type: string;
  warranty: string;
  topFeatures: string;
  showCase: File | undefined;
  materialImage: File | undefined;
  price: string;
}

interface MaterialFormProps {
  supplierId: string;
  onMaterialAdded: (material: Material) => void;
}

export function MaterialForm({ supplierId }: MaterialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialPreview, setMaterialPreview] = useState<string | null>(null);
  const [showcasePreview, setShowcasePreview] = useState<string | null>(null);
  const [materialImage, setMaterialImage] = useState<File | undefined>(
    undefined
  );
  const [showCase, setShowCase] = useState<File | undefined>(undefined);
  const { addMaterial } = useMaterials();

  const { register, handleSubmit, reset, watch } = useForm<MaterialFormData>();
  const materialType = watch("type");

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    console.log(supplierId, "price:", data.price);

    try {
      const formData = new FormData();
      formData.append("supplierId", supplierId);
      formData.append("type", data.type);
      formData.append("warranty", data.warranty);
      formData.append("price", data.price);
      formData.append("topFeatures", data.topFeatures);
      if (materialImage) formData.append("materialImage", materialImage);
      if (showCase) formData.append("showCase", showCase);

      await addMaterial(formData);
      
      // Reset form and show success toast
      reset();
      setMaterialPreview(null);
      setShowcasePreview(null);
      setMaterialImage(undefined);
      setShowCase(undefined);
      
      toast.success("Material added successfully!", {
        description: `${data.type} material has been added to the supplier.`,
      });
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to add material", {
        description: "Please check your information and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaterialImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setMaterialPreview(fileUrl);
      setMaterialImage(file);
    }
  };

  const handleShowcaseImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setShowcasePreview(fileUrl);
      setShowCase(file);
    }
  };

  const removeMaterialImage = () => {
    setMaterialPreview(null);
    setMaterialImage(undefined);
  };

  const removeShowcaseImage = () => {
    setShowcasePreview(null);
    setShowCase(undefined);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Material Type *</Label>
          <Input
            id="type"
            {...register("type", { required: "Material type is required" })}
            placeholder="e.g., Concrete, Steel, Wood, Aluminum"
          />
          {!materialType && (
            <p className="text-sm text-destructive">
              Material type is required
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="warranty">Warranty</Label>
          <Input
            id="warranty"
            {...register("warranty")}
            placeholder="e.g., 5 years, Lifetime, 10-year limited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            {...register("price")}
            placeholder="e.g., 100, 500, 1000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topFeatures">Top Features</Label>
          <Input
            id="topFeatures"
            {...register("topFeatures")}
            placeholder="Key features separated by commas"
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground">
            Maximum 150 characters
          </p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Material Image */}
        <div className="space-y-3">
          <Label htmlFor="materialImage">Material Image</Label>
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50">
            {!materialPreview ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-amber-400" />
                <div className="mt-2">
                  <label
                    htmlFor="materialImage"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md hover:from-amber-600 hover:to-orange-700 transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </label>
                  <input
                    type="file"
                    id="materialImage"
                    accept="image/*"
                    onChange={handleMaterialImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={materialPreview}
                  alt="Material Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  height={192}
                  width={300}
                />
                <button
                  type="button"
                  onClick={removeMaterialImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Showcase Image */}
        <div className="space-y-3">
          <Label htmlFor="showCase">Showcase Image</Label>
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50">
            {!showcasePreview ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-amber-400" />
                <div className="mt-2">
                  <label
                    htmlFor="showCase"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md hover:from-amber-600 hover:to-orange-700 transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </label>
                  <input
                    type="file"
                    id="showCase"
                    accept="image/*"
                    onChange={handleShowcaseImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={showcasePreview}
                  alt="Showcase Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  height={192}
                  width={300}
                />
                <button
                  type="button"
                  onClick={removeShowcaseImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !materialType}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <Plus className="w-4 h-4 mr-2" />
        Add Material
      </Button>
    </form>
  );
}
