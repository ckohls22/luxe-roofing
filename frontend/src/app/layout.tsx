import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./quill.css";
import { Toaster } from "sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

// Define metadata object according to Next.js 13+ standards
export const metadata: Metadata = {
  title: {
    default: "LuxeIQ - Advanced Roof Area Calculator",
    template: "%s | LuxeIQ",
  },
  description:
    "Professional roof area calculation tool using satellite imagery and advanced mapping technology.",
  keywords: ["roof calculator", "area measurement", "construction", "roofing"],
  authors: [{ name: "LuxeIQ Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    siteName: "LuxeIQ",
    title: "LuxeIQ - Advanced Roof Area Calculator",
    description:
      "Professional roof area calculation tool using satellite imagery.",
  },

  icons: {
    icon: "/favicon.ico",
  },
  // viewport: {
  //   width: "device-width",
  //   initialScale: 1,
  //   maximumScale: 1,
  //   userScalable: false,
  // },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component that wraps all pages
 * Provides consistent structure and global styles
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-gradient-to-br antialiased font-sans">
        <div className="flex flex-col min-h-screen">
          <main id="main-content" className="flex-1">
            <Toaster />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
