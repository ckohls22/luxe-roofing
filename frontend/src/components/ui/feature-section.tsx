import React from "react";
import {
  ArrowRight,
  Shield,
  Users,
  Award,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";

const WhyChooseUs = () => {
  const reasons = [
    // {
    //   title: "Military-Level Precision",
    //   description: "Co-founder Carlton Kohler brings Marine Corps discipline and attention to detail to every roofing project, ensuring exceptional craftsmanship.",
    //   icon: Shield,
    //   gradient: "from-amber-200 to-amber-300",
    //   bgPattern: "bg-gradient-to-br from-orange-100/50 to-amber-200/30"
    // },
    {
      title: "Insurance Claims Expertise",
      description:
        "With senior property field adjuster experience at MetLife, we navigate insurance claims with expertise to get you the coverage you deserve.",
      icon: CheckCircle,
      gradient: "from-amber-200 to-amber-300",
      bgPattern: "bg-gradient-to-br from-amber-100/50 to-amber-200/30",
    },
    {
      title: "Premium Materials Only",
      description:
        "We specialize in luxury synthetic shake, slate, and premium roofing systems that enhance your home's curb appeal and value for decades.",
      icon: Star,
      gradient: "from-orange-200 to-orange-300",
      bgPattern: "bg-gradient-to-br from-orange-100/50 to-orange-200/30",
    },
    {
      title: "White-Glove Service",
      description:
        "Our select team delivers personalized service with full transparency, zero shortcuts, and homeowner-first thinking on every project.",
      icon: Users,
      gradient: "from-pink-200 to-pink-300",
      bgPattern: "bg-gradient-to-br from-pink-100/50 to-pink-200/30",
    },
    {
      title: "Award-Winning Excellence",
      description:
        "Our roofing projects have earned recognition including the prestigious 2022 DaVinci Masterpiece Contractor Award for superior craftsmanship.",
      icon: Award,
      gradient: "from-red-300 to-red-400",
      bgPattern: "bg-gradient-to-br from-red-100/50 to-red-300/30",
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Content */}
        <div className="lg:col-span-1 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Why choose us
          </h2>
          <p className="text-gray-600 text-md leading-relaxed mb-8">
            At Luxe Roofing, we combine military precision with insurance
            expertise to deliver premium roofing solutions.
          </p>
          {/* <button className="inline-flex items-center px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
              Get Free Estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </button> */}
        </div>

        {/* Right Grid */}

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 justify-center w-full lg:max-w-2/3 mx-auto">
          {reasons.map((reason, index) => {
            const IconComponent = reason.icon;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-sm p-8 hover:shadow-md transition-all duration-300 hover:-translate-y-2 border border-gray-200 `}
              >
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl  rounded-full transform translate-x-8 -translate-y-8 ${reason.bgPattern}`}
                  ></div>
                  <div
                    className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${reason.gradient} rounded-full transform -translate-x-4 translate-y-4`}
                  ></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${reason.gradient} shadow-lg`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200 group-hover:translate-x-1 transform" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {reason.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {reason.description}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats or Additional Info */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl lg:text-4xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                15+
              </div>
              <div className="text-gray-600 font-medium">
                Years Combined Experience
              </div>
            </div>
            <div className="group">
              <div className="text-3xl lg:text-4xl font-bold text-amber-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                3
              </div>
              <div className="text-gray-600 font-medium">States Served</div>
            </div>
            <div className="group">
              <div className="text-3xl lg:text-4xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                100%
              </div>
              <div className="text-gray-600 font-medium">
                Customer Satisfaction
              </div>
            </div>
            <div className="group">
              <div className="text-3xl lg:text-4xl font-bold text-amber-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                Award
              </div>
              <div className="text-gray-600 font-medium">Winning Quality</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
