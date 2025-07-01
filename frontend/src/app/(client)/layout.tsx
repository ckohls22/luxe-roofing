import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component that wraps all pages
 * Provides consistent structure and global styles
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
