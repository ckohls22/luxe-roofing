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
    <div className="container mx-auto py-8 px-4 max-w-4xl bg-amber-50/30 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">SM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Supplier & Materials Management
          </h1>
        </div>
        <p className="text-amber-800 font-medium">
          Create suppliers and add their materials in a structured workflow
        </p>
      </div>

      {currentStep === "supplier" && (
        <Card className="bg-white shadow-lg border-amber-200">
          <CardHeader className="border-b border-amber-100">
            <CardTitle className="text-gray-900 font-bold">Create New Supplier</CardTitle>
            <CardDescription className="text-amber-800">
              Fill in the supplier information. After creating the supplier, you
              can add materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <SupplierForm onSupplierCreated={handleSupplierCreated} />
          </CardContent>
        </Card>
      )}

      {currentStep === "materials" && createdSupplier && (
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 font-bold flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    Supplier Created Successfully
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    {createdSupplier.name} - Now add materials for this supplier
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={resetForm} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Create New Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold mb-2 text-gray-900">{createdSupplier.name}</h3>
                <p className="text-sm text-amber-800 mb-2">
                  {createdSupplier.description}
                </p>
                <div className="flex gap-4 text-sm text-gray-700">
                  {createdSupplier.email && (
                    <span className="font-medium">Email: {createdSupplier.email}</span>
                  )}
                  {createdSupplier.phone && (
                    <span className="font-medium">Phone: {createdSupplier.phone}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="border-b border-amber-100">
              <CardTitle className="text-gray-900 font-bold">Add Materials</CardTitle>
              <CardDescription className="text-amber-800">
                Add materials for {createdSupplier.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
