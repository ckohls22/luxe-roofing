"use client";

import {
  IconArrowLeft,
  IconBuildingSkyscraper,
  IconFileInvoice,
  IconLoader,
  IconTag,
  IconUser,
} from "@tabler/icons-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";

// Local interface for API-returned roof polygon data
interface ApiRoofPolygon {
  id: string;
  area: {
    squareFeet: number;
    squareMeters: number;
  };
  slope: string;
  points: [number, number][];
}

// Helper function to convert API polygon data to TypedRoofPolygon
// const convertToTypedPolygon = (polygon: ApiRoofPolygon): TypedRoofPolygon => {
//   // Check if polygon.points exists, if not use an empty array
//   const points = polygon.points || [];

//   // Create coordinates safely
//   const coordinates: number[][] =
//     points.length > 0 ? points.map((point) => [point[0], point[1]]) : [[0, 0]]; // Default coordinate if no points exist

//   // Safely create area object
//   const formattedArea: RoofArea = {
//     squareFeet: polygon.area?.squareFeet || 0,
//     squareMeters: polygon.area?.squareMeters || 0,
//     formatted: `${polygon.area?.squareFeet?.toFixed(2) || "0.00"} sq ft`,
//   };

//   // Create centerPoint safely
//   const centerPoint: [number, number] =
//     points.length > 0 && points[0] ? points[0] : [0, 0];

//   return {
//     id: polygon.id || "unknown",
//     coordinates: coordinates,
//     area: formattedArea,
//     label: `Section ${polygon.id || "unknown"}`,
//     centerPoint: centerPoint,
//     slope: polygon.slope || "Unknown",
//   };
// };

interface QuoteDetails {
  quote: {
    id: string;
    quoteNumber: string;
    status: string;
    materialCost: string;
    createdAt: string;
    updatedAt: string;
    formId: string;
    materialId: string;
    supplierId: string;
  };
  form: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string | null;
    status: string;
    roofArea: string | null;
    roofType: string | null;
    buildingType: string | null;
    createdAt: string;
  };
  material: {
    id: string;
    type: string;
    warranty: string;
    price: string;
    materialImage: string | null;
    showCase: string | null;
    topFeatures: string | null;
  };
  supplier: {
    id: string;
    name: string;
    logoUrl: string | null;
    website: string | null;
  };
}

// Status badge component with amber/orange styling
const StatusBadge = ({ status }: { status: string }) => {
  let className = "capitalize";

  switch (status) {
    case "draft":
      className +=
        " bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200";
      break;
    case "sent":
      className +=
        " bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300";
      break;
    case "viewed":
      className +=
        " bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300";
      break;
    case "accepted":
      className +=
        " bg-green-100 text-green-800 hover:bg-green-200 border border-green-300";
      break;
    case "rejected":
      className +=
        " bg-red-100 text-red-800 hover:bg-red-200 border border-red-300";
      break;
    case "expired":
      className +=
        " bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300";
      break;
    default:
      className +=
        " bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200";
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
};

import { RoofArea, RoofPolygon as TypedRoofPolygon } from "@/types";

export default function QuoteDetails() {
  const router = useRouter();
  const { quoteId } = useParams() as { quoteId: string };
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [roofPolygons, setRoofPolygons] = useState<ApiRoofPolygon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuoteDetails() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/quotes/${quoteId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setQuoteDetails(data.quote);

        // Fetch roof polygons if form ID is available
        if (data.quote?.form?.id) {
          const roofResponse = await fetch(
            `/api/admin/forms/${data.quote.form.id}/roof-polygons`
          );
          if (roofResponse.ok) {
            const roofData = await roofResponse.json();
            setRoofPolygons(roofData.polygons || []);
          } else {
            console.error(
              "Failed to fetch roof polygons:",
              roofResponse.status,
              roofResponse.statusText
            );
          }
        }
      } catch (err) {
        console.error("Error fetching quote details:", err);
        setError("Failed to load quote details");
        toast.error("Failed to load quote details");
      } finally {
        setLoading(false);
      }
    }

    if (quoteId) {
      fetchQuoteDetails();
    }
  }, [quoteId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center">
        <IconLoader className="h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-4 text-lg text-gray-600">Loading quote details...</p>
      </div>
    );
  }

  if (error || !quoteDetails) {
    return (
      <div className="container py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Error Loading Quote
          </h2>
          <p className="text-red-600">{error || "Quote not found"}</p>
          <Button
            onClick={() => router.push("/admin/quotes")}
            className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            Return to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const { quote, form, material, supplier } = quoteDetails;

  return (
    <div className="container py-6 px-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-amber-200 hover:bg-amber-50"
          >
            <IconArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Quote Details:{" "}
            <span className="text-amber-600">{quote.quoteNumber}</span>
          </h1>
        </div>
        {/* <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-amber-300 hover:bg-amber-50 text-amber-700"
          >
            <IconFileInvoice className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            <IconPencil className="h-4 w-4 mr-2" />
            Edit Quote
          </Button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quote Information */}
        <Card className="lg:col-span-2 border-amber-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <IconFileInvoice className="h-5 w-5 text-amber-500" />
                  Quote Summary
                </CardTitle>
                <CardDescription>
                  Created on {formatDate(quote.createdAt)}
                </CardDescription>
              </div>
              <StatusBadge status={quote.status} />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quote Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <IconTag className="h-5 w-5 text-amber-500 mr-2" />
                  Quote Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quote Number:</span>
                    <span className="font-medium text-gray-900">
                      {quote.quoteNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Material Cost:</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(quote.materialCost).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(quote.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(quote.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <IconUser className="h-5 w-5 text-amber-500 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-900">{`${form.firstName} ${form.lastName}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900">
                      {form.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {form.phone}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Submission Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(form.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-amber-100" />

            {/* Building and Roof Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <IconBuildingSkyscraper className="h-5 w-5 text-amber-500 mr-2" />
                Building & Roof Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Roof Type:</span>
                    <span className="font-medium text-gray-900">
                      {form.roofType || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Roof Area:</span>
                    <span className="font-medium text-gray-900">
                      {form.roofArea
                        ? `${parseFloat(form.roofArea).toFixed(2)} sq ft`
                        : "Not calculated"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Roof Sections:</span>
                    <span className="font-medium text-gray-900">
                      {roofPolygons.length}
                    </span>
                  </div>
                  {roofPolygons.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Average Slope:</span>
                      <span className="font-medium text-gray-900">
                        {roofPolygons.reduce(
                          (acc, polygon) => acc + polygon.slope,
                          ""
                        ).length > 0
                          ? roofPolygons[0].slope
                          : "Not specified"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Material Information */}
          <Card className="border-amber-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <IconTag className="h-5 w-5 text-amber-500" />
                Material Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Material Image */}
              {material.materialImage && (
                <div className="mb-4">
                  <div className="relative h-40 w-full rounded-md overflow-hidden">
                    <Image
                      src={material.materialImage}
                      alt={material.type}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Material Type:</span>
                  <span className="font-medium text-gray-900">
                    {material.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Warranty:</span>
                  <span className="font-medium text-gray-900">
                    {material.warranty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit Price:</span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(material.price).toFixed(2)}
                  </span>
                </div>
                {material.topFeatures && (
                  <div className="pt-2">
                    <span className="text-gray-500 block mb-2">
                      Top Features:
                    </span>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-100 text-sm">
                      {material.topFeatures}
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Info */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </h4>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {supplier.logoUrl ? (
                    <div className="relative h-8 w-8">
                      <Image
                        src={supplier.logoUrl}
                        alt={supplier.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-amber-100 rounded-md flex items-center justify-center">
                      <IconBuildingSkyscraper className="h-4 w-4 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{supplier.name}</p>
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-600 hover:text-amber-800"
                      >
                        Visit website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
