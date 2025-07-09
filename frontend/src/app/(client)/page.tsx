import { AddressSearch } from "@/components/features/quote-calculator";
import { ConfigureRoofs } from "@/components/features/quote-calculator/ConfigureRoofs";
import SearchProvider, {
  AddressContext,
} from "@/components/features/quote-calculator/providers/SearchProvider";
import RoofTypeSelector from "@/components/features/quote-calculator/RoofTypeSelector";
import { SearchBox } from "@/components/features/quote-calculator/SearchBox";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <div className="min-w-10/12 mt-22  p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
        <Image
          src={
            "https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          }
          width={400}
          height={350}
          alt="luxe roofing hero image "
          className="object-contain w-full h-full rounded-4xl hidden"
        />

        <h1 className="text-center font-bold text-3xl mb-2">
          Instant Roof Quote in <br />
          60 Seconds!
        </h1>
        <p className="text-center max-w-4/6 ">
          Now with luxe roofing get your roof quote in just few clicks
        </p>
      </div>
        <SearchProvider>
            <div className="min-w-10/12 p-5 box-border overflow-hidden bg-amber-200 flex flex-col items-center">
          <RoofTypeSelector />
                
          <SearchBox />
            </div>

        <ConfigureRoofs />
          
        </SearchProvider>
     
      {/* <SearchBox /> */}
    </>
  );
}
