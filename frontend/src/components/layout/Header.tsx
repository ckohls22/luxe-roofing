import Image from "next/image";
import React from "react";
import { Button } from "../ui";
import Link from "next/link";
import { MainNavigationMenu } from "./Nav";
import { PhoneNav } from "./PhoneNav";

const Header: React.FC = () => (
  <header className="flex w-full items-center justify-between h-18 px-6 fixed bg-white z-999 shadow-sm">
    <div className="flex items-center space-x-4 overflow-hidden h-full min-w-16">
      <PhoneNav />
      <Link href={"/"}>
        <Image
          src="/luxeroofinglogo.jpg"
          width={80}
          height={80}
          alt="LuxeIQ Logo"
          className="w-full max-w-22 min-w-16 h-full object-contain rounded-lg"
        />
      </Link>
    </div>
    <MainNavigationMenu/>
    <Link href={"#Get-Quote"} >
      <Button className=" rounded-full transition-colors duration-300 font-medium px-6 py-2 cursor-pointer">
        Get Quote
      </Button>
    </Link>
  </header>
);
export default Header;
