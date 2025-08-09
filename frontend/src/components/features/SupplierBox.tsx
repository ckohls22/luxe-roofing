"use client";

import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  Mail,
  CheckCircle,
  Package,
  Award,
  Sparkles,
  Building2,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { suppliersService } from "@/lib/services/suppliers";
import type { Supplier, Material } from "@/types";
import Image from "next/image";
import { StormAlerts } from "./StormAlerts";
import { AddressContext } from "./quote-calculator/providers/QuoteProvider";
import { getPartialCalculation } from "@/utils/price-calculator";
import { RoofPolygon } from "@/types/roof";

// Constants

const PLACEHOLDER_IMAGE_URL = "https://res.cloudinary.com/placeholder";
const TABS = [
  { key: "details", label: "Details", icon: Package },
  { key: "installation", label: "Installation", icon: Building2 },
  // { key: "contact", label: "Contact", icon: Phone },
] as const;

// Loading Card Component
const LoadingCard: React.FC = () => (
  <Card className="w-full bg-white shadow-lg animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>

      <div className="h-48 bg-gray-200 rounded-lg mb-4" />

      <div className="flex space-x-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>

      <div className="h-20 bg-gray-200 rounded-lg mb-4" />
      <div className="h-12 bg-gray-200 rounded-full" />
    </CardContent>
  </Card>
);

// Placeholder Image Component
const PlaceholderImage: React.FC<{ className?: string; type?: string }> = ({
  className = "",
  type = "material",
}) => (
  <div className={`${className} bg-amber-100 flex items-center justify-center`}>
    <div className="text-center">
      {type === "logo" ? (
        <User className="w-8 h-8 text-amber-600 mx-auto mb-2" />
      ) : (
        <Package className="w-8 h-8 text-amber-600 mx-auto mb-2" />
      )}
      <div className="text-xs text-amber-700">
        {type === "logo" ? "Logo" : "Image"}
      </div>
    </div>
  </div>
);

// Image Component with Fallback
const ImageWithFallback: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  type?: string;
}> = ({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  type = "material",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError || !src || src === PLACEHOLDER_IMAGE_URL) {
    return <PlaceholderImage className={className} type={type} />;
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

// Feature Tags Component
const FeatureTags: React.FC<{ features: string }> = ({ features }) => {
  const tags = features?.split(" ").filter(Boolean).slice(0, 6) || [];

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((feature, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors"
        >
          {feature}
        </Badge>
      ))}
    </div>
  );
};

// Material Selector Component
const MaterialSelector: React.FC<{
  materials: Material[];
  selectedMaterial: Material | null;
  onSelect: (material: Material) => void;
}> = ({ materials, selectedMaterial, onSelect }) => (
  <div className="flex space-x-3 overflow-x-auto pb-2">
    {materials.map((material) => (
      <button
        key={material.id}
        onClick={() => onSelect(material)}
        className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
          selectedMaterial?.id === material.id
            ? "border-amber-500 ring-2 ring-amber-200"
            : "border-gray-200 hover:border-amber-300"
        }`}
      >
        <ImageWithFallback
          key={material.id}
          src={material.materialImage || PLACEHOLDER_IMAGE_URL}
          alt={material.type || "Material"}
          width={64}
          height={64}
          className="w-full h-full"
        />
      </button>
    ))}
  </div>
);

// Tab Content Component
const TabContent: React.FC<{
  activeTab: string;
  supplier: Supplier;
  selectedMaterial: Material | null;
}> = ({ activeTab, supplier, selectedMaterial }) => {
  const createMarkup = (htmlContent: string) => ({
    dangerouslySetInnerHTML: { __html: htmlContent },
  });

  return (
    <div className="min-h-[100px] p-4 bg-amber-50 rounded-lg border border-amber-200">
      {activeTab === "details" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {supplier.description || "No description available"}
          </p>
          {selectedMaterial && (
            <div className="text-xs text-amber-700  p-2 rounded">
              <span className="font-medium">Material:</span>{" "}
              {selectedMaterial.type}
            </div>
          )}
        </div>
      )}

      {activeTab === "installation" && (
        <div className="prose prose-sm max-w-none">
          {supplier.installation ? (
            <div {...createMarkup(supplier.installation)} />
          ) : (
            <p className="text-gray-500">
              No installation information available
            </p>
          )}
        </div>
      )}

      {activeTab === "contact" && (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-2  rounded">
            <Phone className="w-4 h-4 text-amber-600" />
            <span className="text-sm">
              {supplier.phone || "No phone available"}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-2  rounded">
            <Mail className="w-4 h-4 text-amber-600" />
            <span className="text-sm">
              {supplier.email || "No email available"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Quote Success Dialog
const QuoteDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
  selectedMaterial: Material | null;
}> = ({ open, onOpenChange, supplier, selectedMaterial }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 border-0">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-3 text-amber-800">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl">Quote Sent Successfully!</span>
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-700 mb-3 leading-relaxed">
            We&apos;ve sent a detailed quote for{" "}
            <span className="font-bold text-amber-800">
              {selectedMaterial?.type || "N/A"}
            </span>{" "}
            from{" "}
            <span className="font-bold text-amber-800">{supplier.name}</span> to
            your email address.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You&apos;ll receive it within a few minutes. Please check your spam
            folder if you don&apos;t see it in your inbox.
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-200">
          <h4 className="font-bold text-amber-800 mb-3 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Quote Details:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-amber-700">Supplier:</span>
              <span className="font-medium text-amber-800">
                {supplier.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Material:</span>
              <span className="font-medium text-amber-800">
                {selectedMaterial?.type || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Price:</span>
              <span className="font-bold text-amber-800">
                {selectedMaterial?.price || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Warranty:</span>
              <span className="font-medium text-amber-800">
                {selectedMaterial?.warranty || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600  text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Perfect!
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// Main Supplier Card Component
interface SupplierCardProps {
  supplier: Supplier;
  partialVal: number

}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, partialVal }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    supplier.materials?.[0] || null
  );


  const [activeTab, setActiveTab] = useState<
    "details" | "installation" | "contact"
  >("details");
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleGetQuote = async () => {
    console.log(selectedMaterial);
    if (!selectedMaterial) 
      return;

    setIsSubmitting(true);
    try {
      const formId = localStorage.getItem("formId");
      if (!formId) {
        toast.error("Please complete the roof calculation first");
        return;
      }

      const quoteData = {
        supplierId: supplier.id,
        materialId: selectedMaterial.id,
        formId,
      };

      const { data, error } = await suppliersService.submitQuote(quoteData);
      // const data = { success: true };
      // const error = false;

      if (error) {
        toast.error(error);
        return;
      }

      if (data?.success) {
        setShowQuoteDialog(true);
        toast.success("Quote request sent successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send quote request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early return if no materials
  if (!supplier.materials?.length) {
    return (
      <Card className="w-full max-w-2xl white shadow-md">
        <CardContent className="p-6 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <p className="text-gray-600">
            No materials available for this supplier
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-2xl bg-white shadow-none hover:shadow-sm rounded-none">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-200">
                <ImageWithFallback
                  src={supplier.logoUrl || PLACEHOLDER_IMAGE_URL}
                  alt={supplier.name}
                  width={64}
                  height={64}
                  className="w-full h-full"
                  type="logo"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {supplier.name}
                </h3>
                <p className="text-sm text-amber-800">Roofing Supplier</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-amber-700">
                {selectedMaterial?.price
                  ? `$ ${Number(selectedMaterial.price) * partialVal}`
                  : "Price on Request"}
              </div>
            </div>
          </div>
          {/* Showcase Image - Full Width */}
          {selectedMaterial && (
            <div className="mb-6">
              <div className="relative h-64 w-full rounded-lg overflow-hidden border border-amber-200">
                <ImageWithFallback
                  src={selectedMaterial.showCase || PLACEHOLDER_IMAGE_URL}
                  alt={selectedMaterial.type || "Material showcase"}
                  width={600}
                  height={256}
                  className="w-full h-full"
                />
                {selectedMaterial.warranty && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-amber-800 shadow-sm">
                      <Award className="w-3 h-3 mr-1" />
                      {selectedMaterial.warranty}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-gray-900 mb-3">
              {selectedMaterial?.type || "Material"}
            </h4>
            <FeatureTags features={selectedMaterial?.topFeatures || ""} />
          </div>

          {/* Material Selection */}
          <div className="mb-6">
            <h5 className="font-medium text-gray-900 mb-3">
              Available Materials
            </h5>
            <MaterialSelector
              materials={supplier.materials}
              selectedMaterial={selectedMaterial}
              onSelect={setSelectedMaterial}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-3 mb-4 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 hover:cursor-pointer max-w-[150px] ${
                    activeTab === tab.key
                      ? "bg-gray-800 text-white shadow-sm"
                      : "text-gray-900 hover:bg-amber-100"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <TabContent
              activeTab={activeTab}
              supplier={supplier}
              selectedMaterial={selectedMaterial}
            />
          </div>

          {/* Quote Button */}
          <div className="flex gap-3 w-full relative items-center justify-center">
            <Button
              onClick={handleGetQuote}
              disabled={isSubmitting || !selectedMaterial}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-semibold py-6 rounded-full disabled:opacity-50 max-w-[200px] cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 ">
                  <Sparkles className="w-4 h-4" />
                  <span>Get Quote</span>
                </div>
              )}
            </Button>
            <Button
              onClick={() => {
                toast.info("This feature is coming soon!");
              }}
              disabled={isSubmitting || !selectedMaterial}
              className="flex-1 bg-white hover:bg-gray-100  text-black font-semibold py-6 rounded-full border border-gray-300 disabled:opacity-50 max-w-[200px] cursor-pointer"
            >
              <div className="flex items-center justify-center space-x-2">
                {/* <Sparkles className="w-4 h-4" /> */}
                <span>Talk to a Pro</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuoteDialog
        open={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        supplier={supplier}
        selectedMaterial={selectedMaterial}
      />
    </>
  );
};

// Main Container Component
const SupplierBox: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAddress, roofPolygons  } = useContext(AddressContext);
  const partialVal = getPartialCalculation(roofPolygons);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await suppliersService.getSuppliers();

        if (error) {
          setError(error);
          return;
        }

        if (data?.suppliers) {
          const validSuppliers = data.suppliers.filter(
            (supplier) => supplier.materials?.length > 0
          );
          setSuppliers(validSuppliers);
        }
      } catch (err) {
        setError("Failed to load suppliers. Please try again later." + err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">
            Error Loading Suppliers
          </div>
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!suppliers.length) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 font-semibold mb-2">
            No Suppliers Available
          </div>
          <div className="text-yellow-500 text-sm">
            There are currently no suppliers with available materials.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full  mx-auto p-4">
      <div className="space-y-6">
        <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg">
          <StormAlerts
            lat={selectedAddress?.coordinates[1] || 38.8977}
            lng={selectedAddress?.coordinates[0] || -77.0365}
          />
        </div>
        <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg">
          <StormAlerts
            lat={selectedAddress?.coordinates[1] || 38.8977}
            lng={selectedAddress?.coordinates[0] || -77.0365}
          />
        </div>
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} partialVal={partialVal} />
        ))}
      </div>
    </div>
  );
};

export default SupplierBox;
