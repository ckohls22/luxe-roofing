'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RoofPolygon } from '@/types';

// Types
// export interface RoofPolygon {
//   coordinates: number[][];
//   area: number;
//   slope?: number;
// }

// Validation Schema
const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Please enter a valid address'),
  selectedRoofPolygons: z.array(z.object({
    id : z.string(),
    coordinates: z.array(z.array(z.number())),
    area: z.object({
        squareMeters : z.number().positive('Area must be positive'),
        squareFeet : z.number().positive('area must be positive'),
        formatted : z.string()

    }),
    label: z.string(),
    centerPoint : z.array(z.number()),
    slope: z.string(),
  }))
});

type FormData = z.infer<typeof formSchema>;

interface ContactFormProps {
  onSubmit?: (data: FormData) => void;
  initialData?: Partial<FormData>;
  className?: string;
}

export default function LeadForm({ onSubmit, initialData, className = '' }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [countryCode, setCountryCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>("verified");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
  });

  // Auto-detect country code based on user's location
  useEffect(() => {
    const detectCountryCode = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const code = data.country_calling_code || '+1';
        setCountryCode(code);
      } catch (error) {
        console.error('Failed to detect country code:', error);
        setCountryCode('+1'); // Default to US
      }
    };

    detectCountryCode();
  }, []);

  // Load hCaptcha script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const onSubmitForm = async (data: FormData) => {
    if (!captchaToken) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Format phone number with country code
      const formattedPhone = `${countryCode}${data.phone.replace(/^\+?1?/, '')}`;
      
      const submissionData = {
        ...data,
        phone: formattedPhone,
        captchaToken
      };

      // Call the API endpoint
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus('success');
        reset();
        setCaptchaToken(null);
        // Reset hCaptcha
        if (window.hcaptcha) {
          window.hcaptcha.reset();
        }
        onSubmit?.(data);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  return (
    <Card className={`w-[450px] max-w-2xl mx-auto border-0 shadow-none  ${className}`}>
      <CardHeader className="space-y-1">
        {/* <CardTitle className="text-2xl font-bold text-center">Get Your Free Quote</CardTitle> */}
        <CardDescription className="text-center text-gray-600">
        Fill out the form below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Name Fields Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="John"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Doe"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                <span className="text-sm text-gray-600">{countryCode}</span>
              </div>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(555) 123-4567"
                className={`rounded-l-none ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
    
          {/* hCaptcha */}
          <div className="space-y-2">
            <Label>Verification *</Label>
            <div
              className="h-captcha"
              data-sitekey="7c009708-e3a2-4a52-ad28-91c4c25e798c" // hCaptcha test key
              data-callback="handleCaptchaVerify"
              data-expired-callback="handleCaptchaExpire"
            />
            {!captchaToken && (
              <p className="text-sm text-gray-500">Please complete the captcha verification</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            className="w-full bg-orange-500 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Form'
            )}
          </Button>
        </form>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Thank you! Your form has been submitted successfully. We'll contact you within 24 hours.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              There was an error submitting your form. Please try again or contact us directly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Add global declaration for hCaptcha
declare global {
  interface Window {
    hcaptcha: any;
    handleCaptchaVerify: (token: string) => void;
    handleCaptchaExpire: () => void;
  }
}

// Set up global captcha handlers
if (typeof window !== 'undefined') {
  window.handleCaptchaVerify = (token: string) => {
    // This will be overridden by the component's handler
  };
  
  window.handleCaptchaExpire = () => {
    // This will be overridden by the component's handler
  };
}