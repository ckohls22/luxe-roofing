"use client";
import { useContext } from "react";
import { AddressContext } from "./providers/QuoteProvider";
import SupplierBox from "../SupplierBox";

export function ShowResult() {
  const { currentStep } = useContext(AddressContext);
  if (currentStep == "show-result") {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="w-full lg:w-9/12 md:w-3/4  ">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Our Premium Suppliers
          </h2>
          <p className="text-lg mb-4 text-center">
            Discover exceptional materials from trusted partners
          </p>

          <div className="w-full flex items-center mt-4 p-2">
            <SupplierBox />
          </div>
        </div>
      </div>
    );
  }
}
