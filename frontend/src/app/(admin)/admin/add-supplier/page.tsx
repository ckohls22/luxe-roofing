"use client";

import { useState } from "react";
import { SupplierForm } from "@/components/admin/dashboard/supplier/supplier-form";
import { MaterialForm } from "@/components/admin/dashboard/supplier/material-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { Material, Supplier } from "@/types";

export default function Page() {
  const [currentStep, setCurrentStep] = useState<"supplier" | "materials">(
    "supplier"
  );
  const [createdSupplier, setCreatedSupplier] = useState<Supplier | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);

  const handleSupplierCreated = (supplier: Supplier) => {
    setCreatedSupplier(supplier);
    setCurrentStep("materials");
  };

  const handleMaterialAdded = (material: Material) => {
    setMaterials((prev) => [...prev, material]);
  };

  const resetForm = () => {
    setCurrentStep("supplier");
    setCreatedSupplier(null);
    setMaterials([]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Supplier & Materials Management
        </h1>
        <p className="text-muted-foreground">
          Create suppliers and add their materials in a structured workflow
        </p>
      </div>

      {currentStep === "supplier" && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Supplier</CardTitle>
            <CardDescription>
              Fill in the supplier information. After creating the supplier, you
              can add materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierForm onSupplierCreated={handleSupplierCreated} />
          </CardContent>
        </Card>
      )}

      {currentStep === "materials" && createdSupplier && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supplier Created Successfully</CardTitle>
                  <CardDescription>
                    {createdSupplier.name} - Now add materials for this supplier
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={resetForm}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Create New Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{createdSupplier.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {createdSupplier.description}
                </p>
                <div className="flex gap-4 text-sm">
                  {createdSupplier.email && (
                    <span>Email: {createdSupplier.email}</span>
                  )}
                  {createdSupplier.phone && (
                    <span>Phone: {createdSupplier.phone}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Materials</CardTitle>
              <CardDescription>
                Add materials for {createdSupplier.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialForm
                supplierId={createdSupplier.id}
                onMaterialAdded={handleMaterialAdded}
              />
            </CardContent>
          </Card>

          {materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Added Materials ({materials.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.map((material, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{material.type}</h4>
                        <span className="text-sm text-muted-foreground">
                          Warranty: {material.warranty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {material.topFeatures}
                      </p>
                      {material.showCase && (
                        <p className="text-sm">{material.showCase}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
