// src/app/(admin)/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <main className="flex h-screen items-center justify-center">{children}</main>;
  }