import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CgMenuLeft } from "react-icons/cg";

export function PhoneNav() {
  return (
    <DropdownMenu>
      <DropdownMenuContent className="w-[100vw] rounded-none shadow-none p-4 relative top-5 gap-5" align="start">
        <DropdownMenuLabel className="font-bold text-white bg-amber-500 text-xl rounded-sm ">Luxe Roofing</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem className=" text-lg">Services</DropdownMenuItem>
          <DropdownMenuItem className=" text-lg">Knowledge Center</DropdownMenuItem>
          <DropdownMenuItem className=" text-lg">Service Areas</DropdownMenuItem>
          <DropdownMenuItem className=" text-lg">Pricing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className=" text-lg">Financing</DropdownMenuItem>
        <DropdownMenuItem className=" text-lg">Instant Roof Quote</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className=" text-lg">Company</DropdownMenuItem>
        <DropdownMenuItem className=" text-lg">Contact Us</DropdownMenuItem>
      </DropdownMenuContent>
      <DropdownMenuTrigger asChild>
        <CgMenuLeft className="text-2xl text-black cursor-pointer md:hidden" />
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
}
