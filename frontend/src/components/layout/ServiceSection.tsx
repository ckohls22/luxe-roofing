"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

// Define the service card data
const services = [
  {
    title: "Luxury Synthetic Shingle Roofing",
    description:
      "Enhance your home’s curb appeal and value with high-performance synthetic shake or slate roofing. Luxe Roofing offers sustainable, beautiful roofing solutions tailored to your style.",
    imageurl: '/Services/LuxerySyntheticSingleRoofing.webp',
    points: [
      "Elegant, durable synthetic shake or slate options.",
      "Expert consultation and installation.",
      "Sustainable materials that stand the test of time.",
    ],
    redirecturl: "https://www.luxeroofpros.com/luxury-synthetic-shingle-roofing",
  },
  {
    title: "Storm Damage Roof Replacement",
    description:
      "Restore your roof with confidence after storm damage. Luxe Roofing handles the insurance process and roof replacement with professionalism and care.",
    imageurl: '/Services/RoofReplacement.webp',
    points: [
      "Free inspection and expert evaluation.",
      "Assistance with insurance claims.",
      "High-quality replacement to restore protection and aesthetics.",
    ],
    redirecturl: "https://www.luxeroofpros.com/storm-damage-roof-replacement",
  },
  {
    title: "Asphalt Shingle Roofing",
    description:
      "A practical choice for many homeowners. Learn the pros and cons of asphalt roofing and how it compares to premium alternatives like synthetic systems.",
    imageurl: '/Services/AsphaltShingleRoofing.webp',
    points: [
      "Cost-effective and widely available solution.",
      "Transparent comparison with premium systems.",
      "Professional installation and guidance.",
    ],
    redirecturl: "https://www.luxeroofpros.com/asphalt-shingle-roofing",
  },
];

// Service Card Component
type CardProps = {
  title: string;
  description?: string;
  imageurl: string;
  points?: string[];
  redirecturl: string;
} & React.ComponentProps<typeof Card>;

function ServiceCard({ className, ...props }: CardProps) {
  const { title, description, imageurl, points = [], redirecturl } = props;
  return (
    <Card className={cn("w-[380px] h-[600px] pt-0 overflow-hidden rounded-md", className)} {...props} >
      <Image
        src={imageurl}
        alt={title}
        width={600}
        height={400}
        className="h-[250px] object-cover"
      />
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {points.map((point, index) => (
            <div
              key={index}
              className="mb-2 grid grid-cols-[25px_1fr] items-start pb-2 last:mb-0 last:pb-0"
            >
              <span className="flex h-2 w-2 translate-y-1 rounded-full bg-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{point}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={redirecturl} className="w-full">
          <Button className="w-full rounded-full">
            <Check className="mr-2 h-4 w-4" /> Explore
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Services Grid Component
export default function ServicesSection() {
  return (
    <section className="py-12 px-4 sm:px-8 lg:px-16 bg-gray-50" id="service">
      <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {services.map((service, index) => (
          <ServiceCard key={index} {...service} />
        ))}
      </div>
    </section>
  );
}