import { ConfigureRoofs } from "@/components/features/quote-calculator/ConfigureRoofs";
import QuoteProvider from "@/components/features/quote-calculator/providers/QuoteProvider";
import RoofTypeSelector from "@/components/features/quote-calculator/RoofTypeSelector";
import { SearchBox } from "@/components/features/quote-calculator/SearchBox";
import Image from "next/image";

import FeaturesSection from "@/components/ui/feature-section";
import { ShowResult } from "@/components/features/quote-calculator/ShowResult";
import { ShowLeadForm } from "@/components/features/quote-calculator/ShowLeadForm";
import WhyChooseUs from "@/components/ui/feature-section";
import ServicesSection from "@/components/layout/ServiceSection";

export default function HomePage() {
  return (
    <>
      <div className="min-w-10/12 mt-18  p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
        <Image
          src={"/roof_head_image.png"}
          width={380}
          height={290}
          alt="luxe roofing hero image"
          className="object-contain w-3/4 md:w-1/2 lg:w-2/5 h-[160px] "
        />

        <h1 className="text-center font-bold text-3xl lg:mb-2 lg:text-5xl md:text-5xl">
          Instant Roof Quote in <br />
          60 Seconds!
        </h1>
        <p className="text-center max-w-5/6 md:max-w-4/6 lg:block hidden">
          Now with luxe roofing get your roof quote in just few clicks
        </p>
      </div>

      <QuoteProvider>
        <div className="min-w-10/12 p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
          <RoofTypeSelector />

          <SearchBox />
        </div>
        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120">
          <path
            fill="#fee685"
            fill-opacity="1"
            d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,64C840,75,960,117,1080,117.3C1200,117,1320,75,1380,53.3L1440,32L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          ></path>
        </svg> */}
        <ConfigureRoofs />
        <ShowLeadForm />
        <ShowResult />
      </QuoteProvider>
      <ServicesSection/>

      <WhyChooseUs />

      {/* <SearchBox /> */}
    </>
  );
}
