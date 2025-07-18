"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

import { Card, CardContent } from "@/components/ui/Card";

import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import Image from "next/image";

type LoginFormData = {
  username: string;
  password: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>();
  const { login } = useAdminAuth();
  // const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data);

    if (!result.success && result.errors) {
      // Set field-specific errors from API response
      Object.entries(result.errors).forEach(([field, messages]) => {
        if (field === "username" || field === "password") {
          setError(field, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden py-0 bg-white shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">LQ</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-amber-800">
                  Login to LuxelQ Admin Dashboard
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-medium text-gray-900">Email</Label>
                <Input
                  id="email"
                  placeholder="m@example.com"
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  {...register("username", { required: "Email is required" })}
                />
                {errors.username && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="font-medium text-gray-900">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm text-amber-700 hover:text-amber-800 underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Login to Dashboard
              </Button>
            </div>
          </form>
          <div className="relative hidden bg-gradient-to-br from-amber-50 to-orange-100 md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20"></div>
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Roofing Background"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
              fill
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-2">LuxelQ Admin</h2>
                <p className="text-lg opacity-90">Manage your roofing business</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
