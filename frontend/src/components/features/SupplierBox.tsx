'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Mail, CheckCircle, Package, Award, Sparkles, Building2, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { suppliersService } from '@/lib/services/suppliers';
// import type { Material} from '@/types/supplierAndMaterialTypes';
import type { Supplier , Material} from '@/types';

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
  // Check if materials exist and set default material
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(() => {
    return supplier.materials && supplier.materials.length > 0 
      ? supplier.materials[0] 
      : null;
  });
  const [activeTab, setActiveTab] = useState<'details' | 'installation' | 'contact'>('details');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeholderImageUrl = "https://image.com/image"
  const placeholderFeatureTags = ""

  const handleGetQuote = async () => {
    setIsSubmitting(true);
    try {
      const formId = localStorage.getItem('formId');
      if (!formId) {
        toast.error('Please complete the roof calculation first');
        return;
      }

      const quoteData = {
        supplierId: supplier.id || " ",
        materialId: selectedMaterial?.id || " ",
        formId,
        supplierName: supplier.name,
        materialType: selectedMaterial?.type || "",
        price: selectedMaterial?.price || ""
      };

      const { data, error } = await suppliersService.submitQuote(quoteData);
      
      if (error) {
        toast.error(error);
        return;
      }

      if (data?.success) {
        setShowQuoteDialog(true);
        toast.success('Quote request sent successfully!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeatureTags = (features: string) => {
    return features.split(',').map(feature => feature.trim());
  };

  const createMarkup = (htmlContent: string) => {
    return { __dangerouslySetInnerHTML: { __html: htmlContent } };
  };

  // Early return if no materials
  if (!supplier.materials || supplier.materials.length === 0) {
    return (
      <Card className="w-full max-w-md bg-white shadow-lg overflow-hidden">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p>No materials available for this supplier</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Update price display with null check
  const displayPrice = selectedMaterial?.price || 'Price on request';

  return (
    <>
      <Card className="w-full max-w-md bg-white shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-0 hover:scale-101">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="p-5 relative overflow-hidden">
            <div className="absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <ImageWithFallback
                      src={supplier?.logoUrl || placeholderImageUrl}
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
                    {displayPrice}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">per unit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Image */}
          {selectedMaterial && (
            <div className="relative h-52 bg-amber-100 border-2 border-amber-300 mx-4 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={selectedMaterial.showCase || placeholderImageUrl}
                alt={selectedMaterial.type || 'Material showcase'}
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
          )}

          {/* Material Selection */}
          <div className="p-5">
            <div className="flex space-x-3 mb-5">
              {supplier.materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className={`relative w-16 h-16 rounded-xl border overflow-hidden transition-all duration-200 ${
                    selectedMaterial?.id === material.id 
                      ? 'border-amber-400' 
                      : 'border-gray-200 hover:border-amber-200 hover:scale-103'
                  }`}
                >
                  <ImageWithFallback
                    src={material.materialImage || placeholderImageUrl}
                    alt={material.type || 'Material image'}
                    className="w-full h-full object-cover"
                  />
                  {selectedMaterial?.id === material.id && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Material Info */}
            {selectedMaterial && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-black text-lg">
                    {selectedMaterial.type || 'Unnamed Material'}
                  </span>
                  <span className="text-sm text-gray-600 px-3 py-1 rounded-full">
                    Warranty: {selectedMaterial.warranty || 'N/A'}
                  </span>
                </div>
                
                {/* Features Tags */}
                <div className="flex flex-wrap gap-2">
                  {getFeatureTags(selectedMaterial.topFeatures || placeholderFeatureTags)
                    .map((feature, index) => (
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
            )}

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
                    className={`flex-1 py-3 px-4 rounded-full text-sm font-medium  flex items-center justify-center space-x-2 ${
                      activeTab === tab.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700  hover:bg-amber-100'
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
                      <span className="font-medium">Material ID:</span> {selectedMaterial?.id.slice(0, 8)}...
                    </div>
                  </div>
                )}
                {activeTab === 'installation' && (
                  <div className="space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                    <div className="prose prose-sm prose-amber">
                      <div {...createMarkup(supplier.installation || "")} />
                    </div>
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
              className="w-full bg-orange-600 text-white font-bold py-6 rounded-full  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                We've sent a detailed quote for <span className="font-bold text-amber-800">{selectedMaterial?.type}</span> from{' '}
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
                  <span className="font-medium text-amber-800">{selectedMaterial?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Price:</span>
                  <span className="font-bold text-amber-800">{selectedMaterial?.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Warranty:</span>
                  <span className="font-medium text-amber-800">{selectedMaterial?.warranty}</span>
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

const SupplierBox: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await suppliersService.getSuppliers();
        
        if (error) {
          setError(error);
          return;
        }

        if (data?.suppliers) {
          // Filter out suppliers with no materials
          const validSuppliers = data.suppliers.filter(
            supplier => supplier.materials && supplier.materials.length > 0
          );
          setSuppliers(validSuppliers);
          console.log('Valid suppliers:', validSuppliers);
        }
      } catch (err) {
        setError('Failed to load suppliers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">Error loading suppliers</div>
          <div className="text-red-500 text-sm">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-100 text-red-600 hover:bg-red-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Update the empty state check to be more specific
  if (!suppliers.length) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-amber-600 mb-2">No Available Suppliers</div>
          <div className="text-amber-500 text-sm">
            There are currently no suppliers with available materials.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </div>
  );
};

export default SupplierBox;