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
        <div className="w-full lg:w-7/12 md:w-3/4 bg-white   rounded-lg shadow-md border p-7">
          {/* <Button
            variant={"outline"}
            className="flex-1 rounded-full text-md p-7 border-gray-500 shadow-none md:absolute "
            disabled={roofPolygons && roofPolygons.length > 0 ? false : true}
            onClick={() => setCurrentStep("edit-roof")}
          >
            <ArrowLeft size={18} className="ml-2" /> Back
          </Button> */}

          <LeadForm onSubmit={handleLeadSubmit} />
        </div>
      </div>
    );
  }
}
