"use client";

import * as React from "react";
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const blogs: { title: string; href: string }[] = [
  {
    title: "Open Valley Roofs vs. Closed Valley Roofs: Expert Breakdown",
    href: "https://www.luxeroofpros.com/knowledge-center/open-valley-roofs-vs-closed-valley-roofs-luxe-roofings-expert-breakdown",
  },
  {
    title: "The Luxury Roof Built to Withstand Wildfires, Hail, and Hurricanes",
    href: "https://www.luxeroofpros.com/knowledge-center/the-luxury-roof-built-to-withstand-wildfires-hail-and-hurricanes",
  },
  {
    title:
      "Luxury Roofing FAQs: What Every Gated Community Homeowner Should Know",
    href: "https://www.luxeroofpros.com/knowledge-center/luxury-roofing-faqs-what-every-gated-community-homeowner-should-know",
  },
  {
    title: "Why High-End Homeowners Are Switching to Brava Synthetic Shake",
    href: "https://www.luxeroofpros.com/knowledge-center/why-high-end-homeowners-are-switching-to-brava-synthetic-shake",
  },
  {
    title: "Does a DaVinci Roof Increase Home Value?",
    href: "https://www.luxeroofpros.com/knowledge-center/does-a-davinci-roof-increase-home-valuenbsp",
  },
  {
    title: "Understanding Roofing Warranties: What's Covered and What's Not",
    href: "https://www.luxeroofpros.com/knowledge-center/blog-post-title-one-ksk85",
  },
];
// const services = [
//   {
//     title: "Luxury Synthetic Shingle Roofing",
//     href: "/services/synthetic-shingle",
//     description:
//       "Superior roofing solutions that blend beauty, performance, and sustainability with synthetic shake or slate roofs.",
//   },
//   {
//     title: "Storm Damage Roof Replacement",
//     href: "#service",
//     description:
//       "Professional insurance claim handling with expert storm damage assessment and replacement services.",
//   },
//   {
//     title: "Asphalt Shingle Roofing",
//     href: "#service",
//     description:
//       "Budget-friendly traditional roofing solutions with full transparency and comparison to premium systems.",
//   },
// ];

export function MainNavigationMenu() {
  return (
    <NavigationMenu viewport={false} className="hidden md:block">
      <NavigationMenuList >
        <NavigationMenuItem>
          <NavigationMenuTrigger>Services</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                    href="/"
                  >
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Luxe Roofing
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Premium roofing solutions that enhance your homes curb
                      appeal and value with superior craftsmanship.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="#service" title="Asphalt Shingle Roofing">
                Budget-friendly traditional roofing solutions with full
                transparency and comparison to premium systems.
              </ListItem>
              <ListItem
                href="#service"
                title="Luxury Synthetic Shingle"
              >
                Superior roofing solutions that blend beauty, performance, and
                sustainability with synthetic shake or slate roofs.
              </ListItem>
              {/* <ListItem href="/docs/primitives/typography" title="Storm Damage Roof Replacement">
                Professional insurance claim handling with expert storm damage assessment and replacement services.
              </ListItem> */}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="lg:block hidden">
          <NavigationMenuTrigger>Knowledge Center</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {blogs.map((blog) => (
                <ListItem
                  className="text-sm text-gray-600 font-light"
                  key={blog.title}
                  title={blog.title}
                  href={blog.href}
                >
                  {/* {blog.description} */}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem >
          <NavigationMenuTrigger>Pricing</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="https://www.luxeroofpros.com/financing">
                    <div className="font-medium">Financing</div>
                    <div className="text-muted-foreground">
                      Explore our flexible financing options to make your
                      roofing project affordable.
                    </div>
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Instant Roof Quote</div>
                    <div className="text-muted-foreground">
                      Get a quick estimate for your roofing project.
                    </div>
                  </Link>
                </NavigationMenuLink>
                {/* <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Blog</div>
                    <div className="text-muted-foreground">
                      Read our latest blog posts.
                    </div>
                  </Link>
                </NavigationMenuLink> */}
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="lg:block hidden">
          <NavigationMenuTrigger>Service Areas</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="https://www.luxeroofpros.com/georgia">Georgia</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="https://www.luxeroofpros.com/south-carolina">South Carolina</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="https://www.luxeroofpros.com/tennessee">Tennessee</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="https://www.luxeroofpros.com/contact">Contact Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
