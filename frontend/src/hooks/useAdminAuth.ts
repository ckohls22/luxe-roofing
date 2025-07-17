// File: hooks/useAdminAuth.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // or your preferred toast library

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    admin: {
      id: number;
      username: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      status: string;
    };
    token: string;
  };
  errors?: Record<string, string[]>;
}

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (data: LoginData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/dashboard");
        return { success: true, data: result.data };
      } else {
        toast.error(result.message);
        return {
          success: false,
          message: result.message,
          errors: result.errors,
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred" + error;
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });

      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      console.log(error);
      toast.error("Error during logout");
    }
  };

  return {
    login,
    logout,
    isLoading,
  };
}
