import { InfiniteSlider } from "@/components/ui/motion-components/infinite-slider";
import { Zap } from "lucide-react";
import Image from "next/image";

export function Infinite() {
  return (
    <InfiniteSlider gap={24} reverse className="border-b ">
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2 text-gray-700">
        <Image
          src="/luxeroofinglogo.jpg"
          width={50}
          height={50}
          alt="luxe roofing logo"
          className="h-[80px] w-auto"
        />
        Luxe Roofing
      </div>
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2 text-orange-500">
        <Zap size={30} className="font-bold" />
        Instant Roof Quote
      </div>
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2 mx-8  text-gray-700">
        <Image
          src="/luxeroofinglogo.jpg"
          width={50}
          height={50}
          alt="luxe roofing logo"
          className="h-[80px] w-auto"
        />
        Luxe Roofing
      </div>
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2 text-orange-500">
        <Zap size={30} className="font-bold" />
        Instant Roof Quote
      </div>
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2  text-gray-700">
        <Image
          src="/luxeroofinglogo.jpg"
          width={50}
          height={50}
          alt="luxe roofing logo"
          className="h-[80px] w-auto"
        />
        Luxe Roofing
      </div>
      <div className="flex text-2xl font-extrabold items-center justify-center gap-2 text-orange-500">
        <Zap size={30} className="font-bold" />
        Instant Roof Quote
      </div>
    </InfiniteSlider>
  );
}
