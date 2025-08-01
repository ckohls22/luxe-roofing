'use client';

import Image from 'next/image';
import React from 'react';

const services = [
  {
    title: 'Luxury Synthetic Shingle Roofing',
    description: `At Luxe Roofing, we are committed to providing our clients with superior roofing solutions that blend beauty, performance, and sustainability. Our team of experts will work with you to select and install the perfect synthetic shake or slate roof that enhances your home’s curb appeal and value.`,
    image: '/Services/LuxerySyntheticSingleRoofing.webp',
    linkText: 'synthetic shake or slate',
    link: '#',
},
{
    title: 'Storm Damage Roof Replacement',
    description: `Don’t let storm damage compromise your home’s integrity. Trust Luxe Roofing to handle your insurance claim with professionalism and care. Contact us today to schedule your free inspection and take the first step toward restoring your home’s protection and beauty.`,
    image: '/Services/RoofReplacement.webp',
    linkText: 'storm damage',
    link: '#',
},
{
    title: 'Asphalt Shingle Roofing',
    description: `When exploring roofing options, many homeowners encounter asphalt shingles as a common and budget-friendly solution. At Luxe Roofing, we believe in educating our clients with full transparency—especially when it comes to helping you compare traditional asphalt roofing to premium systems like synthetic shake.`,
    image: '/Services/AsphaltShingleRoofing.webp',
    linkText: 'Here’s what you need to know.',
    link: '#',
},
];

export default function ServicesSection() {
  return (
    <section className="pt-7 px-4 sm:px-6 lg:px-8" id="services">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">Our Services</h2>
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-sm overflow-hidden hover:shadow-amber-300 transition duration-300 ease-in-out"
            >
              <div className="h-48 relative">
                <Image
                  src={service.image}
                  alt={service.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-sm"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {service.description.split(service.linkText)[0]}
                  <a
                    href={service.link}
                    className="text-amber-600 underline hover:text-amber-800 transition"
                  >
                    {service.linkText}
                  </a>
                  {service.description.split(service.linkText)[1]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
