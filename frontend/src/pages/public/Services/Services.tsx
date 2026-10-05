import React, { useEffect, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

import HeroSkeleton from "@/components/public/skeletons/HeroSkeleton";
import CategorySkeleton from "@/components/public/skeletons/CategorySkeleton";
import BannerSkeleton from "@/components/public/skeletons/BannerSkeleton";

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: number;
}

const services: Service[] = [
  {
    id: "SERVICE001",
    title: "Home Cleaning",
    description:
      "Professional cleaning for a fresh, clean and comfortable home.",
    image: "/images/home-cleaning.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE002",
    title: "Plumbing",
    description:
      "Reliable plumbing solutions for everyday home maintenance needs.",
    image: "/images/plumbing.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE003",
    title: "Electrical",
    description:
      "Safe and dependable electrical services delivered to your doorstep.",
    image: "/images/electrical.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE004",
    title: "Appliance Repair",
    description:
      "Quick and professional repair services for your home appliances.",
    image: "/images/appliance-repair.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE005",
    title: "Home Painting",
    description:
      "Give your home a fresh new look with professional painting services.",
    image: "/images/painting.jpg",
    rating: 4.7,
  },
  {
    id: "SERVICE006",
    title: "Home Maintenance",
    description:
      "Complete maintenance support for your everyday household needs.",
    image: "/images/home-maintenance.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE007",
    title: "Deep Cleaning",
    description:
      "Detailed cleaning services for kitchens, bathrooms and living spaces.",
    image: "/images/deep-cleaning.jpg",
    rating: 4.9,
  },
  {
    id: "SERVICE008",
    title: "Bathroom Cleaning",
    description:
      "Thorough bathroom cleaning to keep your space fresh and hygienic.",
    image: "/images/bathroom-cleaning.jpg",
    rating: 4.8,
  },
  {
    id: "SERVICE009",
    title: "Kitchen Cleaning",
    description:
      "Professional kitchen cleaning for a cleaner and healthier home.",
    image: "/images/kitchen-cleaning.jpg",
    rating: 4.8,
  },
];

const Services: React.FC = () => {
  const [loading, setLoading] = useState(true);

  /*
   * Temporary loading simulation.
   *
   * Later, replace this with your real API loading state.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  /*
   * -----------------------------
   * LOADING STATE
   * -----------------------------
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#11104f]">
        <HeroSkeleton />

        <CategorySkeleton />

        <BannerSkeleton />
      </main>
    );
  }

  /*
   * -----------------------------
   * ACTUAL SERVICES PAGE
   * -----------------------------
   */
  return (
    <main className="bg-white text-[#11104f]">

      {/* ================= HERO ================= */}

      <section className="flex min-h-screen items-center bg-gradient-to-br from-[#eef2ff] via-white to-[#fff5ef] px-6 py-16 lg:h-screen lg:px-8">
        <div className="mx-auto w-full max-w-4xl text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-[#6366f1]/20 bg-white px-4 py-2 text-sm font-semibold text-[#4338ca] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
            HomeCareX Services
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Professional services.
            <br />
            <span className="text-[#4338ca]">
              Right at your doorstep.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5b5b7a] sm:text-lg">
            From cleaning and plumbing to electrical work and home
            maintenance, find trusted professionals for your everyday home
            needs.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4338ca] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#3730a3]"
            >
              Explore Services
              <ArrowRight size={17} />
            </a>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-[#4338ca]/20 bg-white px-7 py-3.5 text-sm font-bold text-[#4338ca] transition hover:bg-[#eef2ff]"
            >
              Talk to our team
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-[#5b5b7a]">
            {[
              "Trusted professionals",
              "Reliable service",
              "Convenient booking",
            ].map((text, index) => (
              <span
                key={text}
                className="flex items-center gap-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    index % 2 === 0
                      ? "bg-[#ff8a3d]"
                      : "bg-[#4338ca]"
                  }`}
                />

                {text}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ================= SERVICES ================= */}

      <section
        id="services"
        className="flex min-h-screen flex-col bg-[#eef2ff] px-6 py-10 text-[#11104f] lg:h-screen lg:px-8"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">

          <div className="flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between">

            <div>
              <span className="inline-flex rounded-full border border-[#ff8a3d]/30 bg-[#fff5ef] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#e0600f]">
                Our Services
              </span>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reliable services,{" "}
                <span className="text-[#4338ca]">
                  designed around your home.
                </span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-[#5b5b7a]">
              Choose from our range of professional home services and book the
              support you need.
            </p>

          </div>

          <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3">

            {services.map((service) => (
              <article
                key={service.id}
                className="group relative min-h-[240px] overflow-hidden rounded-2xl bg-[#1e1b6b] shadow-[0_10px_30px_-15px_rgba(67,56,202,0.5)] lg:min-h-0"
              >

                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#11104f] via-[#11104f]/50 to-transparent" />

                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#11104f] shadow-md">
                  <Star
                    size={13}
                    fill="#ff8a3d"
                    className="text-[#ff8a3d]"
                  />

                  {service.rating}
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">

                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-white xl:text-xl">
                      {service.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-indigo-100/85 xl:text-sm">
                      {service.description}
                    </p>
                  </div>

                  <Link
                    to="/contact"
                    aria-label={`Book ${service.title}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#ff8a3d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e0600f]"
                  >
                    Book
                    <ArrowRight size={14} />
                  </Link>

                </div>

              </article>
            ))}

          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}

      <section className="flex min-h-[50vh] items-center justify-center bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-bold uppercase tracking-widest text-[#e0600f]">
            HomeCareX
          </p>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#11104f] sm:text-4xl">
            Need a service for your home?
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#5b5b7a]">
            Find the right professional and get your home service booked with
            ease.
          </p>

          <Link
            to="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#e0600f]"
          >
            Get Started
            <ArrowRight size={17} />
          </Link>

        </div>
      </section>

    </main>
  );
};

export default Services;