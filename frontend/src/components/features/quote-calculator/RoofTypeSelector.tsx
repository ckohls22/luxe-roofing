// components/RoofTypeSelector.tsx
"use client";

import { useContext } from "react";
import { House, Factory } from "lucide-react";
import { Button } from "@/components/ui"; 
import { AddressContext } from "./providers/QuoteProvider";

type RoofType = "residential" | "industrial";

export default function RoofTypeSelector() {
  const { roofType, setRoofType } = useContext(AddressContext);

  const options: { type: RoofType; icon: React.ReactNode; label: string }[] = [
    { type: "residential", icon: <House size={18} />, label: "Residential" },
    { type: "industrial", icon: <Factory size={18} />, label: "Industrial" },
    // { type: "commercial", icon: <Warehouse size={18} />, label: "Commercial" },
  ];

  return (
    <div className="flex mt-5 mb-3 w-full px-4 justify-center items-center gap-2">
      {options.map(({ type, icon, label }) => {
        const isActive = roofType === type;
        const base = "rounded-full p-5 transition-colors shadow-none text-sm";
        const activeClasses = "bg-gray-900 text-white shadow hover:bg-gray-900";
        const inactiveClasses =
          "bg-transparent text-gray-700 hover:bg-amber-100";

        return (
          <Button
            key={type}
            onClick={() => setRoofType(type)}
            className={`${base} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {icon} {label}
          </Button>
        );
      })}
    </div>
  );
}
