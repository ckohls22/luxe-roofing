"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useMaterials } from "@/hooks/useMaterials";
import Image from "next/image";
import { Material } from "@/types";

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

const materialTypes = [
  "Concrete",
  "Steel",
  "Wood",
  "Aluminum",
  "Glass",
  "Plastic",
  "Composite",
  "Ceramic",
  "Stone",
  "Other",
];

export function MaterialForm({ supplierId }: MaterialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  console.log(selectedType);
  const [materialPreview, setMaterialPreview] = useState<string | null>(null); // For image preview
  const [showcasePreview, setShowcasePreview] = useState<string | null>(null); // For image preview

  const [materialImage, setMaterialImage] = useState<File | undefined>(
    undefined
  );
  const [showCase, setShowCase] = useState<File | undefined>(undefined);
  const { addMaterial } = useMaterials(); // Assuming useSuppliers hook has addMaterial function

  const { register, handleSubmit, reset } = useForm<MaterialFormData>();

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    console.log(supplierId, "nahi aaya price:", data.price);
    // Simulate API call
    try {
      const formData = new FormData();
      formData.append("supplierId", supplierId);
      formData.append("type", selectedType);
      formData.append("warranty", data.warranty);
      formData.append("price", data.price);
      formData.append("topFeatures", data.topFeatures);
      formData.append("materialImage", materialImage as File);
      formData.append("showCase", showCase as File);

      await addMaterial(formData);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error creating material:", error);
    } finally {
      setIsSubmitting(false);
    }

    reset();
    setSelectedType("");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Material Type *</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Select material type" />
            </SelectTrigger>
            <SelectContent>
              {materialTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedType && (
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

        <div className="space-y-2 md:col-span-2">
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="materialImage">Material Image URL</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/* "
              id="materialImage"
              {...register("materialImage", {
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileUrl = URL.createObjectURL(file);
                    setMaterialPreview(fileUrl);
                    setMaterialImage(file);
                  } else {
                    setMaterialImage(undefined);
                  }
                },
              })}
              placeholder="https://example.com/material-image.jpg"
              className="h-32 w-32"
            />

            {materialPreview && (
              <Image
                src={materialPreview}
                alt="Material Preview"
                className="w-16 h-16 object-cover rounded"
                height={64}
                width={64}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="showCase">Showcase Description</Label>
        <Input
          type="file"
          accept="image/*"
          id="showCase"
          {...register("showCase", {
            onChange: (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const fileUrl = URL.createObjectURL(file);
                setShowcasePreview(fileUrl);
                setShowCase(file);
              } else {
                setShowCase(undefined);
              }
            },
          })}
          placeholder="Detailed description of the material, its applications, and benefits"
        />
        {showcasePreview && (
          <Image
            src={showcasePreview}
            alt="Showcase Preview"
            className="w-16 h-16 object-cover rounded mt-2"
            height={64}
            width={64}
          />
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !selectedType}
        className="w-full"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <Plus className="w-4 h-4 mr-2" />
        Add Material
      </Button>
    </form>
  );
}
