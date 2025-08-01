// import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CgMenuLeft } from "react-icons/cg";
import Link from "next/link";

export function PhoneNav() {
  return (
    <DropdownMenu>
      <DropdownMenuContent className="w-[100vw] rounded-none shadow-none p-4 relative top-5 gap-5" align="start">
        <DropdownMenuLabel className="font-bold text-white bg-amber-500 text-xl rounded-sm">
          Luxe Roofing
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-lg">
            <Link href="#service">Services</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg">
            <Link href="https://www.luxeroofpros.com/knowledge-center">Knowledge Center</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg">
            <Link href="https://www.luxeroofpros.com/service-areas">Service Areas</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg">
            <Link href="https://www.luxeroofpros.com/financing">Pricing</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-lg">
          <Link href="https://www.luxeroofpros.com/financing">Financing</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-lg">
          <Link href="#">Instant Roof Quote</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-lg">
          <Link href="https://www.luxeroofpros.com/our-team">Company</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-lg">
          <Link href="https://www.luxeroofpros.com/contact">Contact Us</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <DropdownMenuTrigger asChild>
        <CgMenuLeft className="text-2xl text-black cursor-pointer md:hidden" />
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
}
