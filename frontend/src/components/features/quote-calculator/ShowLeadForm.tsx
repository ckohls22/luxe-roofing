"use client";
import { useContext } from "react";
import { AddressContext } from "./providers/QuoteProvider";
import LeadForm from "./LeadForm";

export function ShowLeadForm() {
  const { currentStep, setCurrentStep } = useContext(AddressContext);
  const handleLeadSubmit = (): void => {
    // Send data to backend or process form submission('show-result')
    // Move to the results page after successful submission
    setCurrentStep("show-result");
    console.log("Form submitted" + currentStep);
  };

  if (currentStep == "lead-form") {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="w-full lg:w-5/12 md:w-3/4 bg-white shadow-sm border p-7">
        
          <LeadForm onSubmit={handleLeadSubmit} />
        </div>
      </div>
    );
  }
}
