"use client";

import {  ArrowRight, Edit, MapPin } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { AddressContext } from "./providers/QuoteProvider";
// import { MapContainer } from "./MapContainer";
import { RoofAreaDisplay } from "./RoofAreaDisplay";
import { Button } from "@/components/ui";
// import LeadForm from "./LeadForm";
// import SupplierBox from "../SupplierBox";
// import { RoofPolygon } from "@/types/index";
import { MapBoxComp } from "@/components/features/quote-calculator/MapBoxComp"
// import GoogleMapComponent, {
//   GoogleMapComponentRef,
// } from "@/app/(client)/detector/GoogleMapComp";
// import { BuildingDetector } from "./BuildingDetector";
// import { GoogleMapComp } from "../GoogleMaps/GoogleMapComp";
// import { loadGoogleMaps } from "../GoogleMaps/googleMapLoader";
// import { RoofPolygons } from "@/db/schema";
// import { MapBoxComp } from "@/app/(client)/detector/MapBoxComp";
import GoogleMapComponent from "../GoogleMaps/MapGoogle";
import { GoogleMapComponentRef } from "../GoogleMaps/MapGoogle";

export function ConfigureRoofs() {
  const mapRef = useRef<GoogleMapComponentRef>(null);
  // const [polygonData, setPolygonData] = useState<Coordinate[][]>([]);
  // const [shouldLoadMap, setShouldLoadMap] = useState(false);
  // const mainbuilding: Position[][] = [];
  const [isEditable, setIsEditable] = useState<boolean>(true);
  const {
    selectedAddress,
    currentStep,
    isLoading,
    // setIsLoading,
    // roofDetected,
    handleRoofDetected,
    handleAreaCalculated,
    roofPolygons,
    handleLabelChange,
    handleSlopeChange,
    // previousStep,
    setCurrentStep,
  } = useContext(AddressContext);

  // Handle area calculation
  // const handleAreaCalculatedWithLoading = useCallback(
  //   (polygons: RoofPolygon[]) => {
  //     try {
  //       handleAreaCalculated(polygons);
  //     } catch (error) {
  //       console.error("Error calculating roof area:", error);
  //     }
  //   },
  //   [handleAreaCalculated]
  // );

  // Handle loading state changes from map
  // const handleLoadingChange = useCallback(
  //   (loading: boolean) => {
  //     setIsLoading(loading);
  //   },
  //   [setIsLoading]
  // );

  // Handle next step
  // const handleNextStep = useCallback(() => {
  //   if (canProceedToNextStep()) {
  //     nextStep();
  //   }
  // }, [canProceedToNextStep, nextStep]);

  // Handle back to search
  // const handleBackToSearch = () => {
  //   setCurrentStep("search");
  // };

  // Effect to validate step and address - revert to search if no address
  useEffect(() => {
    if (
      (currentStep === "select-roof" ||
        currentStep === "edit-roof" ||
        currentStep === "lead-form") &&
      !selectedAddress
    ) {
      console.log("changing back to search step");
      setCurrentStep("search");
    }
  }, [currentStep, selectedAddress, setCurrentStep]);

  // map comp
  // function handleBuildingDetected(building:Coordinate[][]) {
  //   console.log(building);
  //   mainbuilding = building
  //   drawExamplePolygon()
  //   // drawSamplePolygon(building)
  // }

  // const handlePolygonsChange = (polygons) => {
  //   console.log("Polygons updated:", polygons);
  // };

  // const drawExamplePolygon = () => {
  //   if (mapRef.current) {
  //     // Draw a single polygon

  //     mapRef.current.drawPolygon(mainbuilding[0]);

  //     // Or draw multiple polygons
  //     // mapRef.current.drawPolygons(polygonData);
  //   }
  // };

  // const handleMapLoad = () => {
  //   console.log("Map loaded successfully!");
  // };

  // const handleMapError = (error: string) => {
  //   console.error("Map failed to load:", error);
  // };

  // Only render for edit-roof or lead-form steps
  if (currentStep === "search") {
    return null;
  }

  // Don't render if no address selected (will be handled by useEffect)
  if (!selectedAddress) {
    return null;
  }

  // Show map and navigation only in edit-roof step
  if (currentStep == "select-roof" || currentStep == "edit-roof") {
    // console.log(selectedAddress);
    return (
      <>
        <div className="w-full flex justify-center mt-6">
          <div className=" w-full lg:w-7/12 md:w-3/4 bg-white border  rounded-lg shadow-lg">
            <div className="p-7 w-full">
              <h2 className="text-2xl font-bold">Select Your Roof</h2>
              <div className="flex gap-2 my-4 bg-amber-50 border border-amber-300 p-2 rounded-xl">
                <MapPin size={20} className="text-amber-600" />
                <p className="text-sm">
                  {selectedAddress?.address || "No Address Found"}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-md shadow-white sm:w-full h-[450px] overflow-hidden box-border bg-amber-300 mt-7  relative">
                {/* <MapContainer
                  selectedAddress={selectedAddress}
                  onAreaCalculated={handleAreaCalculatedWithLoading}
                  isLoading={isLoading}
                  onLoadingChange={handleLoadingChange}
                  roofPolygons={roofPolygons}
                /> */}

                {/* <MapBoxComp
                  selectedAddress={selectedAddress}
                  isLoading={isLoading}
                  onLoadingChange={handleLoadingChange}
                  onAreaCalculated={handleAreaCalculated}
                  roofPolygons={roofPolygons}
                  onBuildingDetected={handleRoofDetected}
                /> */}
                {/* 
                <BuildingDetector
                  selectedAddress={{
                    address: "123 Main St, City, State",
                    coordinates: [-82.185389, 27.065555],
                    placeId: "abc123",
                  }}
                  onBuildingDetected={(buildings) => {
                    if (buildings) {
                      handleRoofDetected(buildings)
                      console.log(
                        `Found ${buildings.length} buildings:`,
                        buildings
                      );
                    } else {
                      console.log("No buildings found");
                    }
                  }}
                  onError={(error) => {
                    console.error("Detection error:", error);
                  }}
                  onLoading={(isLoading) => {
                    console.log("Loading:", isLoading);
                  }}
                  searchRadius={100} // Search within 100 meters
                />
                <GoogleMapComponent
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                  onPolygonsChange={(polygons) => console.log(polygons)}
                  initialPolygons={roofDetected}
                  // showNoRoofOverlay={true}
                  // minPolygonsRequired={1}
                  center={{ lat: 40.7128, lng: -74.006 }}
                  zoom={15}
                /> */}

                {/* <GoogleMapComponent
                  ref={mapRef}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                  onPolygonsChange={handlePolygonsChange}
                  initialPolygons={polygonData} // Load polygons on mount
                  center={{ lat: 38.8977, lng: -77.0365 }} // Center on your data
                  zoom={15}
                /> */}

                {/* {shouldLoadMap && (
                  <GoogleMapComp
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                    width="100%"
                    height="100%"
                    center={{
                      lat: selectedAddress.coordinates[1],
                      lng: selectedAddress.coordinates[0],
                    }}
                    zoom={20}
                    className="max-w-full w-full h-full"
                  />
                )} */}
                {/* <GoogleMapComponent
                  ref={mapRef}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                  onPolygonsChange={handleAreaCalculated}
                  center={{ lat: 40.7128, lng: -74.006 }}
                  zoom={10}
                  initialPolygons={[]}
                /> */}
                  <MapBoxComp
                    selectedAddress={selectedAddress}
                    onBuildingDetected={handleRoofDetected}
                  />
                <GoogleMapComponent
                  ref={mapRef}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                  onPolygonsChange={handleAreaCalculated}
                  center={{ lat: 38.8977, lng: -77.0365 }} 
                  zoom={17}
                  editable={isEditable}
                  // initialPolygons={roofDetected}
                />
              </div>
            </div>

            {/* Show area display only if polygons exist */}
            {roofPolygons && (
              <>
                <div className="bg-amber-200  p-7 relative w-full  flex flex-col items-center">
                  <div className="lg:max-w-10/12 max-w-[350px] ">
                    <RoofAreaDisplay
                      roofPolygons={roofPolygons}
                      isLoading={isLoading}
                      onLabelChange={handleLabelChange}
                      onSlopeChange={handleSlopeChange}
                    />
                  </div>
                  <div className="flex gap-3 mt-6 w-full">
                    {/* <Button
                      onClick={handleBackToSearch}
                      variant="outline"
                      className="flex-1  rounded-full text-md p-7"
                    >
                      <ArrowLeft size={18} className="ml-2" />
                      Back
                    </Button> */}
                    <Button
                      onClick={()=>setIsEditable(true)}
                      variant="outline"
                      className="flex-1  rounded-full text-md p-7"
                    >
                      <Edit size={18} className="ml-2" />
                      Edit Roofs
                    </Button>
                    <Button
                      onClick={()=>setIsEditable(false)}
                      variant="outline"
                      className="flex-1  rounded-full text-md p-7"
                    >
                      <Edit size={18} className="ml-2" />
                      close Editing
                    </Button>
                    <Button
                      className="flex-1 bg-black rounded-full text-md p-7 disabled:bg-gray-800"
                      disabled={
                        roofPolygons && roofPolygons.length > 0 ? false : true
                      }
                      onClick={() => setCurrentStep("lead-form")}
                    >
                      Next Step
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}

// google map loader
// import Script from "next/script";
// import { RoofPolygon } from "@/types";

// declare global {
//   interface Window {
//     google: typeof google;
//     // initGoogleMaps: () => void;
//     googleMapsReady: boolean;
//   }
// }

// interface GoogleMapComponentProps {
//   apiKey: string;
//   height?: string;
//   width?: string;
//   center?: { lat: number; lng: number };
//   zoom?: number;
//   className?: string;
// }

// interface MapLoadingState {
//   isLoading: boolean;
//   isLoaded: boolean;
//   hasError: boolean;
//   errorMessage?: string;
// }

// // Global state management
// let globalApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!;
// let isScriptLoaded = false;
// let isScriptLoading = false;
// const pendingCallbacks = new Set<() => void>();

// const GoogleMapComp: React.FC<GoogleMapComponentProps> = ({
//   apiKey,
//   height = "100%",
//   width = "100%",
//   center = { lat: 37.7749, lng: -122.4194 },
//   zoom = 14,
//   className = "",
// }) => {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<google.maps.Map | null>(null);
//   const isMountedRef = useRef<boolean>(true);

//   const [loadingState, setLoadingState] = useState<MapLoadingState>({
//     isLoading: true,
//     isLoaded: false,
//     hasError: false,
//   });

//   // Set global API key
//   useEffect(() => {
//     if (apiKey && !globalApiKey) {
//       globalApiKey = apiKey;
//     }
//   }, [apiKey]);

//   // Safe state setter
//   const safeSetState = (newState: Partial<MapLoadingState>) => {
//     if (isMountedRef.current) {
//       setLoadingState((prev) => ({ ...prev, ...newState }));
//     }
//   };

//   // Initialize map function
//   const initializeMap = () => {
//     if (!mapRef.current || !window.google?.maps || !isMountedRef.current) {
//       return;
//     }

//     try {
//       // Clean up existing map
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current = null;
//       }

//       // Create new map
//       mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
//         center,
//         zoom,
//         mapTypeId: "satellite",
//         disableDefaultUI: true,
//         zoomControl: true,
//         gestureHandling: "auto",
//         tilt: 0,
//       });

//       safeSetState({
//         isLoading: false,
//         isLoaded: true,
//         hasError: false,
//       });
//     } catch (error) {
//       console.error("Error initializing Google Map:", error);
//       safeSetState({
//         isLoading: false,
//         isLoaded: false,
//         hasError: true,
//         errorMessage: "Failed to initialize map",
//       });
//     }
//   };

//   // Handle script load
//   const handleScriptLoad = () => {
//     if (!window.google?.maps) {
//       safeSetState({
//         isLoading: false,
//         isLoaded: false,
//         hasError: true,
//         errorMessage: "Google Maps API not available",
//       });
//       return;
//     }

//     isScriptLoaded = true;
//     window.googleMapsReady = true;

//     // Execute all pending callbacks
//     pendingCallbacks.forEach((callback) => {
//       try {
//         callback();
//       } catch (error) {
//         console.error("Error in pending callback:", error);
//       }
//     });
//     pendingCallbacks.clear();

//     // Initialize this map instance
//     setTimeout(initializeMap, 50);
//   };

//   // Handle script error
//   const handleScriptError = () => {
//     isScriptLoading = false;
//     safeSetState({
//       isLoading: false,
//       isLoaded: false,
//       hasError: true,
//       errorMessage: "Failed to load Google Maps script",
//     });
//   };

//   // Check if script is ready and initialize map
//   useEffect(() => {
//     isMountedRef.current = true;

//     const checkAndInitialize = () => {
//       if (window.google?.maps && window.googleMapsReady) {
//         // Script already loaded, initialize immediately
//         setTimeout(initializeMap, 50);
//       } else if (isScriptLoaded && window.google?.maps) {
//         // Script loaded but not marked ready, initialize
//         setTimeout(initializeMap, 50);
//       } else {
//         // Script not ready, add to pending callbacks
//         pendingCallbacks.add(() => {
//           if (isMountedRef.current) {
//             setTimeout(initializeMap, 50);
//           }
//         });
//       }
//     };

//     checkAndInitialize();

//     return () => {
//       isMountedRef.current = false;
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current = null;
//       }
//     };
//   }, []);

//   // Update map properties when they change
//   useEffect(() => {
//     if (
//       mapInstanceRef.current &&
//       loadingState.isLoaded &&
//       isMountedRef.current
//     ) {
//       try {
//         mapInstanceRef.current.setCenter(center);
//         mapInstanceRef.current.setZoom(zoom);
//       } catch (error) {
//         console.error("Error updating map properties:", error);
//       }
//     }
//   }, [center.lat, center.lng, zoom, loadingState.isLoaded]);

//   return (
//     <>
//       {/* Load script only once globally */}
//       {globalApiKey &&
//         (() => {
//           isScriptLoading = true;
//           return (
//             <Script
//               src={`https://maps.googleapis.com/maps/api/js?key=${globalApiKey}&loading=async`}
//               strategy="lazyOnload"
//               onLoad={handleScriptLoad}
//               onError={handleScriptError}
//             />
//           );
//         })()}

//       <div className={`relative ${className}`}>
//         {/* Loading State */}
//         {loadingState.isLoading && (
//           <div
//             className="absolute inset-0 bg-white flex items-center justify-center z-10 rounded-lg border"
//             style={{ width, height }}
//           >
//             <div className="flex flex-col items-center space-y-3">
//               <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
//               <p className="text-gray-600 text-sm font-medium">
//                 Loading Map...
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Error State */}
//         {loadingState.hasError && (
//           <div
//             className="absolute inset-0 bg-red-50 border border-red-200 flex items-center justify-center text-red-700 z-10 rounded-lg"
//             style={{ width, height }}
//           >
//             <div className="text-center p-4">
//               <div className="mb-2">
//                 <svg
//                   className="h-12 w-12 text-red-500 mx-auto"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//               </div>
//               <h3 className="font-semibold text-lg mb-1">Map Load Error</h3>
//               <p className="text-sm text-red-600">
//                 {loadingState.errorMessage || "Unable to load the map"}
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Map Container */}
//         <div
//           ref={mapRef}
//           style={{ width, height }}
//           className="rounded-lg overflow-hidden bg-gray-100"
//         />
//       </div>
//     </>
//   );
// };

// // Optional: Pre-loader component for better performance
// // const GoogleMapsScriptLoader: React.FC<{ apiKey: string }> = ({ apiKey }) => {
// //   useEffect(() => {
// //     if (!globalApiKey) {
// //       globalApiKey = apiKey;
// //     }
// //   }, [apiKey]);

// //   if (isScriptLoaded || isScriptLoading) {
// //     return null;
// //   }

// //   isScriptLoading = true;

// //   return (
// //     <Script
// //       src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`}
// //       strategy="lazyOnload"
// //       onLoad={() => {
// //         isScriptLoaded = true;
// //         window.googleMapsReady = true;
// //         pendingCallbacks.forEach(callback => {
// //           try {
// //             callback();
// //           } catch (error) {
// //             console.error('Error in pending callback:', error);
// //           }
// //         });
// //         pendingCallbacks.clear();
// //       }}
// //       onError={() => {
// //         isScriptLoading = false;
// //         console.error('Failed to load Google Maps script');
// //       }}
// //     />
// //   );
// // };
