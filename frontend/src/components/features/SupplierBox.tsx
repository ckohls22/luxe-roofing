'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Mail, CheckCircle, Package, Award, Sparkles, Building2, User, Clock } from 'lucide-react';

// Mock API data
const mockApiResponse = {
  suppliers: [
  {
    id: "1a2b3c4d-1111-2222-3333-444455556666",
    logoUrl: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562801/LuxelQ/supplier1_logo.jpg",
    name: "EcoShield Roofing Co.",
    description: "Leading sustainable roofing solutions provider with a reputation for quality and eco-conscious materials.",
    installation: "Seamless and clean work. Roof looks elegant and highly durable.",
    phone: "9876543210",
    email: "contact@ecoshield.com",
    createdAt: "2025-07-13T17:50:54.413Z",
    updatedAt: "2025-07-13T17:50:54.413Z",
    materials: [
      {
        id: "eco-001",
        supplierId: "1a2b3c4d-1111-2222-3333-444455556666",
        price: "$3150",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562911/LuxelQ/roof_material_eco1.jpg",
        type: "Composite Shingle",
        warranty: "20 years",
        topFeatures: "UV-resistant, Recyclable, Windproof",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562913/LuxelQ/roof_showcase_eco1.jpg",
        createdAt: "2025-07-13T17:51:55.613Z",
        updatedAt: "2025-07-13T17:51:55.613Z"
      },
      {
        id: "eco-002",
        supplierId: "1a2b3c4d-1111-2222-3333-444455556666",
        price: "$3425",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562955/LuxelQ/roof_material_eco2.jpg",
        type: "Green Tile",
        warranty: "25 years",
        topFeatures: "Eco-friendly, Temperature-regulating, Algae-resistant",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562956/LuxelQ/roof_showcase_eco2.jpg",
        createdAt: "2025-07-13T17:53:00.000Z",
        updatedAt: "2025-07-13T17:53:00.000Z"
      },
      {
        id: "eco-003",
        supplierId: "1a2b3c4d-1111-2222-3333-444455556666",
        price: "$2980",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562960/LuxelQ/roof_material_eco3.jpg",
        type: "Recycled Metal",
        warranty: "18 years",
        topFeatures: "Low-carbon footprint, Heat deflection, Durable finish",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562961/LuxelQ/roof_showcase_eco3.jpg",
        createdAt: "2025-07-13T17:54:00.000Z",
        updatedAt: "2025-07-13T17:54:00.000Z"
      }
    ]
  },
  {
    id: "2b3c4d5e-7777-8888-9999-000011112222",
    logoUrl: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562805/LuxelQ/supplier2_logo.jpg",
    name: "Titan Roof Experts",
    description: "Experts in heavy-duty roofing with superior protection against extreme climates.",
    installation: "Highly professional crew. Finished ahead of schedule with zero errors.",
    phone: "9345092345",
    email: "sales@titanroof.com",
    createdAt: "2025-07-13T18:10:54.413Z",
    updatedAt: "2025-07-13T18:10:54.413Z",
    materials: [
      {
        id: "titan-001",
        supplierId: "2b3c4d5e-7777-8888-9999-000011112222",
        price: "$4720",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562925/LuxelQ/roof_material_titan1.jpg",
        type: "Metal Roofing",
        warranty: "30 years",
        topFeatures: "Fire-resistant, Lightning safe, Thermal coating",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562926/LuxelQ/roof_showcase_titan1.jpg",
        createdAt: "2025-07-13T18:12:55.613Z",
        updatedAt: "2025-07-13T18:12:55.613Z"
      },
      {
        id: "titan-002",
        supplierId: "2b3c4d5e-7777-8888-9999-000011112222",
        price: "$4995",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562970/LuxelQ/roof_material_titan2.jpg",
        type: "Corrugated Steel",
        warranty: "35 years",
        topFeatures: "Storm-proof, High impact resistance, Anti-corrosion",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562971/LuxelQ/roof_showcase_titan2.jpg",
        createdAt: "2025-07-13T18:13:00.000Z",
        updatedAt: "2025-07-13T18:13:00.000Z"
      },
      {
        id: "titan-003",
        supplierId: "2b3c4d5e-7777-8888-9999-000011112222",
        price: "$4550",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562975/LuxelQ/roof_material_titan3.jpg",
        type: "Aluminum Sheet",
        warranty: "28 years",
        topFeatures: "Rust-resistant, Lightweight, Reflective layer",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562976/LuxelQ/roof_showcase_titan3.jpg",
        createdAt: "2025-07-13T18:14:00.000Z",
        updatedAt: "2025-07-13T18:14:00.000Z"
      }
    ]
  },
  {
    id: "3c4d5e6f-abc1-def2-ghi3-jkl456789012",
    logoUrl: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562807/LuxelQ/supplier3_logo.jpg",
    name: "Skyline Roof Designs",
    description: "Artistic and performance-driven roofing crafted to elevate the aesthetics of homes.",
    installation: "Stylish finish. Boosted the entire curb appeal of our house.",
    phone: "9123409876",
    email: "info@skylineroof.com",
    createdAt: "2025-07-13T18:30:54.413Z",
    updatedAt: "2025-07-13T18:30:54.413Z",
    materials: [
      {
        id: "sky-001",
        supplierId: "3c4d5e6f-abc1-def2-ghi3-jkl456789012",
        price: "$3890",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562932/LuxelQ/roof_material_skyline1.jpg",
        type: "Slate Tile",
        warranty: "50 years",
        topFeatures: "Elegant finish, Low maintenance, Eco-stone certified",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562933/LuxelQ/roof_showcase_skyline1.jpg",
        createdAt: "2025-07-13T18:32:55.613Z",
        updatedAt: "2025-07-13T18:32:55.613Z"
      },
      {
        id: "sky-002",
        supplierId: "3c4d5e6f-abc1-def2-ghi3-jkl456789012",
        price: "$4120",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562982/LuxelQ/roof_material_skyline2.jpg",
        type: "Architectural Shingle",
        warranty: "35 years",
        topFeatures: "Dimensional texture, Long life, Mold resistant",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562983/LuxelQ/roof_showcase_skyline2.jpg",
        createdAt: "2025-07-13T18:33:30.000Z",
        updatedAt: "2025-07-13T18:33:30.000Z"
      },
      {
        id: "sky-003",
        supplierId: "3c4d5e6f-abc1-def2-ghi3-jkl456789012",
        price: "$4400",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562985/LuxelQ/roof_material_skyline3.jpg",
        type: "Terracotta Clay",
        warranty: "45 years",
        topFeatures: "Natural thermal insulation, Traditional look, Water-resistant",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562986/LuxelQ/roof_showcase_skyline3.jpg",
        createdAt: "2025-07-13T18:34:10.000Z",
        updatedAt: "2025-07-13T18:34:10.000Z"
      }
    ]
  },
  {
    id: "4d5e6f7g-xyz3-uvw4-rst5-opq678901234",
    logoUrl: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562810/LuxelQ/supplier4_logo.jpg",
    name: "BuildCore Roofing",
    description: "Reliable and budget-friendly roofing materials with strong weather resilience.",
    installation: "Best value for money. Durable and solid structure.",
    phone: "9012345678",
    email: "hello@buildcore.com",
    createdAt: "2025-07-13T18:45:54.413Z",
    updatedAt: "2025-07-13T18:45:54.413Z",
    materials: [
      {
        id: "build-001",
        supplierId: "4d5e6f7g-xyz3-uvw4-rst5-opq678901234",
        price: "$2750",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562940/LuxelQ/roof_material_buildcore1.jpg",
        type: "Asphalt Shingle",
        warranty: "15 years",
        topFeatures: "Cost-effective, Easy to install, Weather-coated",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562942/LuxelQ/roof_showcase_buildcore1.jpg",
        createdAt: "2025-07-13T18:47:55.613Z",
        updatedAt: "2025-07-13T18:47:55.613Z"
      },
      {
        id: "build-002",
        supplierId: "4d5e6f7g-xyz3-uvw4-rst5-opq678901234",
        price: "$2990",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562990/LuxelQ/roof_material_buildcore2.jpg",
        type: "Bitumen Felt",
        warranty: "10 years",
        topFeatures: "Waterproof, Budget roofing, Flexible layering",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562991/LuxelQ/roof_showcase_buildcore2.jpg",
        createdAt: "2025-07-13T18:48:30.000Z",
        updatedAt: "2025-07-13T18:48:30.000Z"
      },
      {
        id: "build-003",
        supplierId: "4d5e6f7g-xyz3-uvw4-rst5-opq678901234",
        price: "$3220",
        materialImage: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562995/LuxelQ/roof_material_buildcore3.jpg",
        type: "Concrete Tile",
        warranty: "22 years",
        topFeatures: "Strong load capacity, Weatherproof, Fire retardant",
        showCase: "https://res.cloudinary.com/djtt5oivu/image/upload/v1752562996/LuxelQ/roof_showcase_buildcore3.jpg",
        createdAt: "2025-07-13T18:49:15.000Z",
        updatedAt: "2025-07-13T18:49:15.000Z"
      }
    ]
  }
]

};

interface Material {
  id: string;
  supplierId: string;
  price: string;
  materialImage: string;
  type: string;
  warranty: string;
  topFeatures: string;
  showCase: string;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  logoUrl: string;
  name: string;
  description: string;
  installation: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  materials: Material[];
}

// Loading Card Component
const LoadingCard: React.FC = () => (
  <Card className="w-full max-w-md  bg-white shadow-lg overflow-hidden">
    <CardContent className="p-0">
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-200 rounded-full animate-pulse"></div>
            <div>
              <div className="h-5 bg-amber-200 rounded animate-pulse w-32 mb-2"></div>
              <div className="h-3 bg-amber-100 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-orange-200 rounded animate-pulse w-16 mb-1"></div>
            <div className="h-3 bg-orange-100 rounded animate-pulse w-12"></div>
          </div>
        </div>
      </div>
      <div className="h-48 bg-gradient-to-r from-amber-100 to-yellow-100 animate-pulse"></div>
      <div className="p-4 space-y-4">
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 bg-amber-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-amber-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-amber-100 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="h-20 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-gradient-to-r from-orange-300 to-amber-300 rounded-lg animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
);

// Placeholder Image Component
const PlaceholderImage: React.FC<{ className?: string; type?: string }> = ({ className, type = "material" }) => (
  <div className={`${className}  flex items-center justify-center`}>
    <div className="text-center">
      {type === "logo" ? (
        <User className="w-8 h-8 text-amber-600 mx-auto mb-2" />
      ) : (
        <Package className="w-12 h-12 text-amber-600 mx-auto mb-2" />
      )}
      {/* <div className="text-xs text-amber-700 font-medium">
        {type === "logo" ? "Logo" : "Material"}
      </div> */}
    </div>
  </div>
);

// Image Component with Fallback
const ImageWithFallback: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string; 
  type?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, type, onLoad, onError }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  if (imageError) {
    return <PlaceholderImage className={className} type={type} />;
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={`${className} bg-gradient-to-br from-amber-100 to-orange-100 animate-pulse absolute inset-0 flex items-center justify-center`}>
          <Clock className="w-6 h-6 text-amber-600 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

interface SupplierCardProps {
  supplier: Supplier;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(supplier.materials[0]);
  const [activeTab, setActiveTab] = useState<'details' | 'installation' | 'contact'>('details');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetQuote = async () => {
    setIsSubmitting(true);
    try {
      // Get form ID from localStorage
      const formId = localStorage.getItem('formId');
      
      const quoteData = {
        supplierId: supplier.id,
        materialId: selectedMaterial.id,
        formId: formId,
        supplierName: supplier.name,
        materialType: selectedMaterial.type,
        price: selectedMaterial.price
      };

      // Mock API call - replace with actual endpoint
      console.log('Sending quote request:', quoteData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowQuoteDialog(true);
    } catch (error) {
      console.error('Error sending quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeatureTags = (features: string) => {
    return features.split(',').map(feature => feature.trim());
  };

  return (
    <>
      <Card className="w-full max-w-md  bg-white shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-0 hover:scale-101">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="p-5   relative overflow-hidden">
            <div className="absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <ImageWithFallback
                      src={supplier.logoUrl}
                      alt={supplier.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm p-7"
                      type="logo"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{supplier.name}</h3>
                    <p className='text-gray-700 text-sm mt-1'>leading roof supplier</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">
                    {selectedMaterial.price}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">per unit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Image */}
          <div className="relative h-52 bg-amber-100 border-2 border-amber-300 mx-4 rounded-lg overflow-hidden">
            <ImageWithFallback
              src={selectedMaterial.showCase}
              alt={selectedMaterial.type}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            {/* <div className="absolute top-4 left-4">
              <Badge className="bg-gray-900 text-white border-0 shadow-md">
                <Building2 className="w-3 h-3 mr-1" />
                {selectedMaterial.type}
              </Badge>
            </div> */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-white  text-black border shadow-md rounded-full">
                <Award className="w-3 h-3 mr-1" />
                {selectedMaterial.warranty}
              </Badge>
            </div>
          </div>

          {/* Material Selection */}
          <div className="p-5">
            <div className="flex space-x-3 mb-5">
              {supplier.materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className={`relative w-16 h-16 rounded-xl border overflow-hidden transition-all duration-200 ${
                    selectedMaterial.id === material.id 
                      ? 'border-amber-400' 
                      : 'border-gray-200 hover:border-amber-200 hover:scale-103'
                  }`}
                >
                  <ImageWithFallback
                    src={material.materialImage}
                    alt={material.type}
                    className="w-full h-full object-cover"
                  />
                  {selectedMaterial.id === material.id && (
                    <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Material Info */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-black text-lg">{selectedMaterial.type}</span>
                <span className="text-sm text-gray-600  px-3 py-1 rounded-full">
                  Warranty: {selectedMaterial.warranty}
                </span>
              </div>
              
              {/* Features Tags */}
              <div className="flex flex-wrap gap-2">
                {getFeatureTags(selectedMaterial.topFeatures).map((feature, index) => (
                  <Badge 
                    key={index}
                    className="bg-amber-50 border-amber-200 text-gray-600 hover:bg-amber-100 cursor-pointer transition-all duration-300"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Details Tabs */}
            <div className="mb-5">
              <div className="flex space-x-1 mb-4  p-1 ">
                {[
                  { key: 'details', label: 'Details', icon: Package },
                  { key: 'installation', label: 'Installation', icon: Building2 },
                  { key: 'contact', label: 'Contact', icon: Phone }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                        : 'text-amber-700 hover:text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[80px] p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{supplier.description}</p>
                    <div className="text-xs text-gray-500 bg-white/50 p-2 rounded-lg">
                      <span className="font-medium">Material ID:</span> {selectedMaterial.id.slice(0, 8)}...
                    </div>
                  </div>
                )}
                {activeTab === 'installation' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-amber-700 mb-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium text-sm">Installation Services</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{supplier.installation}</p>
                  </div>
                )}
                {activeTab === 'contact' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-700 font-medium">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-700 font-medium">{supplier.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Get Quote Button */}
            <Button 
              onClick={handleGetQuote}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Get a Quote</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quote Success Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
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
                We've sent a detailed quote for <span className="font-bold text-amber-800">{selectedMaterial.type}</span> from{' '}
                <span className="font-bold text-amber-800">{supplier.name}</span> to your email address.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                You'll receive it within a few minutes. Please check your spam folder if you don't see it in your inbox.
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
                  <span className="font-medium text-amber-800">{supplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Material:</span>
                  <span className="font-medium text-amber-800">{selectedMaterial.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Price:</span>
                  <span className="font-bold text-amber-800">{selectedMaterial.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Warranty:</span>
                  <span className="font-medium text-amber-800">{selectedMaterial.warranty}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowQuoteDialog(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Perfect! Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main component to display all supplier cards
const SupplierCards: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchSuppliers = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSuppliers(mockApiResponse.suppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Our Premium Suppliers
          </h1>
          <p className="text-gray-600 text-lg">Discover exceptional materials from trusted partners</p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mt-4 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Show loading cards
            Array.from({ length: 6 }).map((_, index) => (
              <LoadingCard key={index} />
            ))
          ) : (
            // Show actual supplier cards
            suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierCards;