import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer: React.FC = () => (
  <footer className="bg-white rounded-lg shadow-sm dark:bg-gray-900 m-4">
    <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex flex-col items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse"
        >
          <Image
            src="/luxeroofinglogo.jpg"
            width={52}
            height={52}
            alt="Luxe Roofing Logo"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Luxe Roofing
          </span>
        </Link>
        <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
          <li>
            <a href="/about" className="hover:underline me-4 md:me-6">
              About
            </a>
          </li>
          <li>
            <a href="/privacy" className="hover:underline me-4 md:me-6">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="/licensing" className="hover:underline me-4 md:me-6">
              Licensing
            </a>
          </li>
          <li>
            <a href="/contact" className="hover:underline">
              Contact
            </a>
          </li>
        </ul>
      </div>
      <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
      <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
        © {new Date().getFullYear()}{" "}
        <Link href="/" className="hover:underline">
          Luxe Roofing
        </Link>
        . All Rights Reserved.
      </span>
    </div>
  </footer>
);

export default Footer;
