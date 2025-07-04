import { useState, useEffect } from "react";
import type { Supplier } from "@/types/supplierAndMaterialTypes";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(data.suppliers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const addSupplier = async (formData: FormData) => {
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add supplier");
      const data = await response.json();
      setSuppliers((prev) => [...prev, data.supplier]);
      return data.supplier;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to add supplier"
      );
    }
  };

  return { suppliers, loading, error, addSupplier, refetch: fetchSuppliers };
};
