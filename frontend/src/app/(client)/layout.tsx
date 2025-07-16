import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Poppins } from 'next/font/google'

interface RootLayoutProps {
  children: React.ReactNode;
}


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // load required weights
  variable: '--font-poppins',          // optional, for CSS variable usage
  display: 'swap',
})

/**
 * Root layout component that wraps all pages
 * Provides consistent structure and global styles
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className={`flex flex-col min-h-screen ${poppins.className} `}>
      <Header />
      <main id="main-content" className="flex-1 ">
        {children}
      </main>
      <Footer />
    </div>
  );
}
