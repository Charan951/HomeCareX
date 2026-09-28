import React from "react";
import { Link } from "react-router-dom";

const services = [
  {
    title: "Home Cleaning",
    description:
      "Professional cleaning services to keep your home clean, fresh and comfortable.",
    image: "/images/home-cleaning.jpg",
  },
  {
    title: "Plumbing Services",
    description:
      "Reliable plumbing services for leaks, repairs, installations and maintenance.",
    image: "/images/plumbing.jpg",
  },
  {
    title: "Electrical Services",
    description:
      "Safe and professional electrical services for your home.",
    image: "/images/electrical.jpg",
  },
  {
    title: "Painting Services",
    description:
      "Professional painting services to give your home a fresh and beautiful look.",
    image: "/images/painting.jpg",
  },
  {
    title: "Appliance Repair",
    description:
      "Quick and reliable repair services for your household appliances.",
    image: "/images/appliance-repair.jpg",
  },
  {
    title: "Home Maintenance",
    description:
      "Complete maintenance services to keep your home safe and comfortable.",
    image: "/images/home-maintenance.jpg",
  },
];

const Services: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* PAGE HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">

        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ff8a3d]/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#4338ca]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">

          <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
            Our Services
          </span>

          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-[#4338ca]">
            Professional Home Services
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-gray-600 leading-7">
            Reliable and convenient services designed to keep
            your home clean, safe and comfortable.
          </p>

        </div>
      </section>


      {/* SERVICES */}

      <section className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {services.map((service) => (

              <div
                key={service.title}
                className="
                  group
                  bg-white
                  rounded-2xl
                  overflow-hidden
                  border
                  border-gray-100
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  duration-300
                "
              >

                <div className="overflow-hidden">

                  <img
                    src={service.image}
                    alt={service.title}
                    className="
                      w-full
                      h-56
                      object-cover
                      group-hover:scale-105
                      transition-transform
                      duration-500
                    "
                  />

                </div>

                <div className="p-6">

                  <h2 className="text-xl font-bold text-[#4338ca]">
                    {service.title}
                  </h2>

                  <p className="mt-3 text-gray-600 leading-7 text-sm">
                    {service.description}
                  </p>

                  <Link
                    to="/contact"
                    className="
                      inline-flex
                      items-center
                      mt-5
                      text-[#ff8a3d]
                      font-bold
                      text-sm
                      hover:text-[#4338ca]
                      transition
                    "
                  >
                    Request Service
                    <span className="ml-1">→</span>
                  </Link>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* CTA */}

      <section className="bg-[#4338ca] py-16">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Need Help With Your Home?
          </h2>

          <p className="mt-4 text-indigo-100">
            Choose the right service and let HomeCareX make
            your home care simple and convenient.
          </p>

          <Link
            to="/contact"
            className="
              inline-flex
              items-center
              mt-8
              px-8
              py-3.5
              rounded-lg
              bg-[#ff8a3d]
              text-white
              font-bold
              hover:bg-white
              hover:text-[#4338ca]
              transition-all
              duration-300
            "
          >
            Contact Us
            <span className="ml-2">→</span>
          </Link>

        </div>

      </section>

    </div>
  );
};

export default Services;