import { useState } from "react";
import type { Material } from "@/types/supplierAndMaterialTypes";

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async (supplierId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/materials?supplierId=${supplierId}`
      );
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (formData: FormData) => {
    console.log("added Material:", formData);
    try {
      const response = await fetch("/api/admin/materials", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add material");
      const data = await response.json();
      setMaterials((prev) => [...prev, data.material]);
      return data.material;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to add material"
      );
    }
  };

  return { materials, loading, error, addMaterial, fetchMaterials };
};
