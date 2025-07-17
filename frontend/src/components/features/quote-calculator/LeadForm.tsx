"use client";

import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AddressContext } from "./providers/SearchProvider";
import { SearchAddress } from "@/types";
import { RoofPolygon, RoofType } from "@/types";
import { Turnstile } from "@marsidev/react-turnstile";

// Validation Schema only for form inputs
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type FormData = z.infer<typeof formSchema>;

type SubmissionPayload = FormData & {
  address: SearchAddress;
  roofPolygons: RoofPolygon[];
  roofType: RoofType;
  // // phone: string;
  captchaToken: string;
};

interface ContactFormProps {
  onSubmit?: (data: SubmissionPayload) => void;
  initialData?: Partial<FormData>;
  className?: string;
}

export default function LeadForm({
  onSubmit,
  initialData,
  className = "",
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  // Consume currentStep from provider
  const { selectedAddress, roofPolygons, roofType, currentStep, nextStep } =
    useContext(AddressContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  // Auto-detect country code
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("https://ipapi.co/json/");
        const data = await resp.json();
        setCountryCode(data.country_calling_code || "+1");
      } catch {
        setCountryCode("+1");
      }
    })();
  }, []);

  // Add this effect to watch for step changes
  useEffect(() => {
    if (currentStep === "lead-form") {
      // Force captcha re-render by updating its key
      setCaptchaKey((prev) => prev + 1);
    }
    if (currentStep !== "lead-form") {
      // Reset form when leaving lead-form step
      console.log(currentStep);
    }
  }, [currentStep]);

  const resetForm = () => {
    reset();
    setSubmitError(null);
    setCaptchaToken(null);
  };

  const onSubmitForm = async (data: FormData) => {
    console.log(roofPolygons);
    setSubmitError(null);
    if (!selectedAddress) return setSubmitError("Please select an address.");
    if (!captchaToken)
      return setSubmitError("Please complete the captcha verification.");

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const payload: SubmissionPayload = {
      ...data,
      address: selectedAddress,
      roofPolygons: roofPolygons,
      roofType,
      captchaToken,
    };

    // Debug log
    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch("/api/client/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Add this debug log
      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Status ${response.status}`);
      }

      setSubmitStatus("success");
      resetForm();
      onSubmit?.(payload);
      nextStep();

      const prev = JSON.parse(
        localStorage.getItem("roof_quote_history") || "[]"
      );
      localStorage.setItem(
        "roof_quote_history",
        JSON.stringify([...prev, payload])
      );
    } catch (e: unknown) {
      console.error("Submission error:", e);
      setSubmitStatus("error");

      if (e instanceof Error) {
        setSubmitError(e.message);
      } else {
        setSubmitError("Submission failed");
      }
    }
  };

  // Turnstile success handler
  const handleTurnstileSuccess = (token: string) => {
    setCaptchaToken(token);
    setSubmitError(null);
  };

  return (
    <Card
      className={`w-[450px] max-w-full mx-auto border-0 shadow-none ${className}`}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center mb-2">
          Get Your Free Quote
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Fill out the form below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {submitError && (
          <Alert className="border-red-500 bg-red-50 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="John"
                className={`h-12 rounded-full border ${
                  errors.firstName ? "border-red-500" : "border-gray-500"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Doe"
                className={`h-12 rounded-full border ${
                  errors.lastName ? "border-red-500" : "border-gray-500"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john.doe@example.com"
              className={`h-12 rounded-full border ${
                errors.email ? "border-red-500" : "border-gray-500"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <div className="flex">
              <div className="flex items-center px-3 bg-amber-100 border border-r-0 border-gray-500 rounded-full rounded-r-md h-12">
                {countryCode}
              </div>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="1234567890"
                className={`h-12 rounded-full rounded-l-none border ${
                  errors.phone ? "border-red-500" : "border-gray-500"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* Captcha */}
          <div className="space-y-2">
            <Label>Verification *</Label>
            <Turnstile
              key={captchaKey} // Add this key prop
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={handleTurnstileSuccess}
              onError={() => {
                setCaptchaToken(null);
                setSubmitError("Captcha verification failed");
              }}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full p-7 bg-gradient-to-r from-orange-400 to-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
        {submitStatus === "success" && (
          <Alert className="border-green-500 bg-green-50 flex items-center gap-2 mt-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <AlertDescription>Submitted successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
