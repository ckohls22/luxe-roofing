'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Info,
  Phone,
  Mail,
} from 'lucide-react';

/* ---------- Data models ---------- */

interface Material {
  id: string;
  materialImage: string;
  type: string;
  warranty: string;
  topFeatures: string;
  showCase: string;
}

interface Supplier {
  id: string;
  logoUrl: string;
  name: string;
  description: string;
  installation: string;
  phone: string;
  email: string;
  materials: Material[];
}

/* ---------- Component ---------- */

const SupplierBox: React.FC = () => {
  const [data, setData] = useState<Supplier[] | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/suppliers');
        if (!response.ok) throw new Error('Network response was not ok');
        const result: { suppliers: Supplier[] } = await response.json();
        setData(result.suppliers);
      } catch (err) {
        console.error('Error fetching supplier data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        No suppliers available
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Suppliers Grid */}
      <div className="flex flex-col gap-6">
        {data.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-sm p-6">
            {/* Supplier Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {supplier.logoUrl ? (
                  <img
                    src={supplier.logoUrl}
                    alt={supplier.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=Logo';
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-400">
                    {supplier.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{supplier.name}</h2>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                  Featured Supplier
                </span>
              </div>
            </div>

            {/* Materials Display */}
            {supplier.materials && supplier.materials.length > 0 && (
              <div className="space-y-4">
                {/* Main Material Showcase */}
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedMaterials[supplier.id] 
                      ? supplier.materials.find(m => m.id === selectedMaterials[supplier.id])?.showCase
                      : supplier.materials[0].showCase}
                    alt="Material Showcase"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Material';
                    }}
                  />
                </div>

                {/* Material Selection Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {supplier.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterials(prev => ({
                        ...prev,
                        [supplier.id]: material.id
                      }))}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedMaterials[supplier.id] === material.id 
                          ? 'border-orange-500' 
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={material.materialImage}
                        alt={material.type}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80?text=Material';
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Selected Material Details */}
                {supplier.materials.map((material) => (
                  selectedMaterials[supplier.id] === material.id && (
                    <div key={material.id} className="space-y-2">
                      <h3 className="font-semibold text-gray-800">{material.type}</h3>
                      <p className="text-sm text-gray-600">Warranty: {material.warranty}</p>
                      <p className="text-sm text-gray-600">{material.topFeatures}</p>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Supplier Details Toggle */}
            <div className="mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setExpandedSupplier(
                  expandedSupplier === supplier.id ? null : supplier.id
                )}
                className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >
                Company Details
                {expandedSupplier === supplier.id ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSupplier === supplier.id && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-gray-700">{supplier.description}</p>
                  <p className="text-sm text-gray-600">{supplier.installation}</p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                GET QUOTE
              </button>
              <button
                type="button"
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                CONTACT SUPPLIER
              </button>
            </div>

            {/* Individual Supplier Financing Section */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financing Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-gray-800">0.00% APR</div>
                  <div className="text-sm text-gray-600">up to 6 mo*</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600">Interest as Low as</div>
                  <div className="text-lg font-bold text-gray-800">5.99%*</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600">Payments as Low as</div>
                  <div className="text-lg font-bold text-gray-800">$2,821/mo*</div>
                </div>
              </div>
              <button
                type="button"
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
              >
                GET PRE-QUALIFIED
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierBox;
