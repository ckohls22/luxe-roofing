import React from "react";
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogDescription,
  MorphingDialogContainer,
  MorphingDialogClose,
} from "@/components/ui/motion-components/motion-primitives/morphing-dialog";
import { PlusIcon } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

const features: Feature[] = [
  {
    title: "No Sales Games Promise",
    description:
      "We don't do pressure. We do precision. As your roofing advisor, not a salesman, we'll deliver a transparent, concierge-level roof assessment—so you can make confident, informed decisions without the sales noise.",
    imageSrc:
      "https://images.squarespace-cdn.com/content/v1/680fb8abdcd8c5395f8d4932/1749571242578-KUPVEWA2A9BYJCO2GCHV/image+house.png?format=1500w",
    imageAlt: "Roof advisor consultation",
  },
  {
    title: "Decades Of Protection",
    description:
      "Our synthetic shake systems are engineered to outlast the elements and time itself—delivering authentic beauty and elite protection for decades. It's more than a roof. It's a legacy for your home.",
    imageSrc:
      "https://images.squarespace-cdn.com/content/v1/680fb8abdcd8c5395f8d4932/1749571242578-KUPVEWA2A9BYJCO2GCHV/image+house.png?format=1500w",
    imageAlt: "Durable roof installation",
  },
  {
    title: "Lifetime Craftsmanship Warranty",
    description:
      "We install every roof like it's protecting our own estate. If our hard work ever falls short, we fix it—no questions asked. That's the standard our name and reputation are built on.",
    imageSrc:
      "https://images.squarespace-cdn.com/content/v1/680fb8abdcd8c5395f8d4932/1749571242578-KUPVEWA2A9BYJCO2GCHV/image+house.png?format=1500w",
    imageAlt: "Warranty guarantee seal",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 mt-7">
      <div className="max-w-7xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold">Why Choose Us</h2>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Discover the commitments that set our roofing services apart.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature) => (
          <MorphingDialog
            key={feature.title}
            transition={{ type: "spring", bounce: 0.05, duration: 0.25 }}
          >
            <MorphingDialogTrigger
              style={{ borderRadius: "12px" }}
              className="flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900"
            >
              <MorphingDialogImage
                src={feature.imageSrc}
                alt={feature.imageAlt}
                className="h-48 w-full object-cover"
              />
              <div className="flex grow flex-row items-end justify-between px-3 py-2">
                <div>
                  <MorphingDialogTitle className="text-zinc-950 dark:text-zinc-50">
                    {feature.title}
                  </MorphingDialogTitle>
                  <MorphingDialogDescription className="text-zinc-500 dark:text-zinc-400">
                    {feature.description}
                  </MorphingDialogDescription>
                </div>
                <div
                  className="relative ml-1 flex h-6 w-6 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg border border-orange-700 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98] dark:border-zinc-50/10 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500"
                  aria-hidden="true"
                >
                  <PlusIcon size={12} />
                </div>
              </div>
            </MorphingDialogTrigger>

            <MorphingDialogContainer>
              <MorphingDialogContent
                style={{ borderRadius: "24px" }}
                className="pointer-events-auto relative flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900 sm:w-[500px]"
              >
                <MorphingDialogImage
                  src={feature.imageSrc}
                  alt={feature.imageAlt}
                  className="h-full w-full object-cover"
                />
                <div className="p-6">
                  <MorphingDialogTitle className="text-2xl text-zinc-950 dark:text-zinc-50">
                    {feature.title}
                  </MorphingDialogTitle>
                  <MorphingDialogDescription
                    disableLayoutAnimation
                    variants={{
                      initial: { opacity: 0, scale: 0.8, y: 100 },
                      animate: { opacity: 1, scale: 1, y: 0 },
                      exit: { opacity: 0, scale: 0.8, y: 100 },
                    }}
                  >
                    <p className="mt-2 text-zinc-500 dark:text-zinc-500">
                      {feature.description}
                    </p>
                  </MorphingDialogDescription>
                </div>
                <MorphingDialogClose className="text-zinc-50" />
              </MorphingDialogContent>
            </MorphingDialogContainer>
          </MorphingDialog>
        ))}
      </div>
    </section>
  );
}
