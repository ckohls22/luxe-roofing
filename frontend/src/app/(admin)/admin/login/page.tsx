"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLogin() {
  return (
    <div className="min-h-screen  flex items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
