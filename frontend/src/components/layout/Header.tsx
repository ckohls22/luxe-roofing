import Image from "next/image";
import React from "react";
// import { CgMenuLeft } from "react-icons/cg";
import { Button } from "../ui";
import Link from "next/link";

const Header: React.FC = () => (
  <header className="flex w-full items-center justify-between h-18 px-6 fixed bg-white z-10 overflow-hidden">
    <div className="flex items-center space-x-4">
      {/* <CgMenuLeft className='text-2xl text-black cursor-pointer lg:hidden' /> */}

      <Link href={"/"}>
        <Image
          src="/luxeroofinglogo.jpg"
          width={80}
          height={80}
          alt="LuxeIQ Logo"
        />
      </Link>
    </div>
    <Link href={"#Get-Quote"} >
      <Button className=" rounded-full transition-colors duration-300 font-medium px-6 py-2 cursor-pointer">
        Get Quote
      </Button>
    </Link>
  </header>
);
export default Header;
