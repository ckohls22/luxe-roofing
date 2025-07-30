import { ConfigureRoofs } from "@/components/features/quote-calculator/ConfigureRoofs";
import QuoteProvider from "@/components/features/quote-calculator/providers/QuoteProvider";
import RoofTypeSelector from "@/components/features/quote-calculator/RoofTypeSelector";
import { SearchBox } from "@/components/features/quote-calculator/SearchBox";
import Image from "next/image";

import FeaturesSection from "@/components/ui/feature-section";
import { ShowResult } from "@/components/features/quote-calculator/ShowResult";
import { ShowLeadForm } from "@/components/features/quote-calculator/ShowLeadForm";

export default function HomePage() {
  return (
    <>
      <div className="min-w-10/12 mt-18  p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
        <Image
          src={"/roof_head_image.png"}
          width={400}
          height={350}
          alt="luxe roofing hero image"
          className="object-contain w-3/4 md:w-1/2 lg:w-2/5 h-full rounded-4xl"
        />

        <h1 className="text-center font-bold text-3xl mb-2 lg:text-6xl md:text-5xl">
          Instant Roof Quote in <br />
          60 Seconds!
        </h1>
        <p className="text-center max-w-5/6 md:max-w-4/6">
          Now with luxe roofing get your roof quote in just few clicks
        </p>
      </div>

      <QuoteProvider>
        <div className="min-w-10/12 p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
          <RoofTypeSelector />

          <SearchBox />
        </div>
        <ConfigureRoofs />
        <ShowLeadForm/>
        <ShowResult/>
      </QuoteProvider>

      <FeaturesSection />

      {/* <SearchBox /> */}
    </>
  );
}
