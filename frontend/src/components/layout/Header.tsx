import Image from 'next/image';
import React from 'react';
// import { CgMenuLeft } from "react-icons/cg";
import { Button } from '../ui';
import Link from 'next/link';

const Header: React.FC = () => (
    <header className='flex w-full items-center justify-between h-20 px-6 fixed bg-white z-10'>
     
        <div className='flex items-center space-x-4'>
        {/* <CgMenuLeft className='text-2xl text-black cursor-pointer lg:hidden' /> */}

            <Link href={"/"}><Image src="/luxeroofinglogo.jpg" width={80} height={80} alt="LuxeIQ Logo" /></Link>
        </div>
        <Link href={"#Get-Quote"} >
        <Button className=' rounded-full transition-colors duration-300 font-medium px-6 py-2'>
            Get a Quote
        </Button>
        
        </Link>



    </header>
    // <header
    //     style={{
    //         background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
    //         color: '#fff',
    //         padding: '1.5rem 2rem',
    //         display: 'flex',
    //         alignItems: 'center',
    //         justifyContent: 'space-between',
    //         boxShadow: '0 2px 8px rgba(30,60,114,0.08)',
    //     }}
    // >
    //     <div style={{ display: 'flex', alignItems: 'center' }}>
    //         <img
    //             src="/logo.png"
    //             alt="LuxeIQ Logo"
    //             style={{ height: 40, marginRight: 16 }}
    //         />
    //         <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, letterSpacing: 1 }}>
    //             LuxeIQ Quote Calculator
    //         </h1>
    //     </div>
    //     <nav>
    //         {/* Add navigation links here if needed */}
    //     </nav>
    // </header>
);

export default Header;