import React, { useEffect, useState } from "react";

interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

const banners: Banner[] = [
  {
    id: "BANNER001",
    title: "Quality Home Services",
    description:
      "Find reliable professionals for your everyday home service needs.",
    image: "/images/banners/home-services.jpg",
    link: "/services",
  },
  {
    id: "BANNER002",
    title: "Make Your Home Care Simple",
    description:
      "Choose a service, select a convenient slot, and get the service you need.",
    image: "/images/banners/home-care.jpg",
    link: "/services",
  },
  {
    id: "BANNER003",
    title: "Professional Services at Home",
    description:
      "Explore HomeCareX services designed around your convenience.",
    image: "/images/banners/professional-services.jpg",
    link: "/services",
  },
];

const BannerSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === banners.length - 1
          ? 0
          : previousIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentBanner = banners[currentIndex];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">

        <div className="relative overflow-hidden rounded-3xl bg-[#4338ca]">

          {/* Banner Image */}
          <img
            src={currentBanner.image}
            alt={currentBanner.title}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />

          {/* Overlay */}
          <div className="relative min-h-[320px] p-8 sm:p-12 lg:p-16">

            <div className="max-w-2xl text-white">

              <p className="text-sm font-bold uppercase tracking-wide text-[#ff8a3d]">
                HomeCareX
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
                {currentBanner.title}
              </h2>

              <p className="mt-4 text-base leading-7 text-white/90 sm:text-lg">
                {currentBanner.description}
              </p>

              <a
                href={currentBanner.link}
                className="mt-6 inline-block rounded-lg bg-[#ff8a3d] px-6 py-3 font-semibold text-white transition hover:bg-[#e0600f]"
              >
                Explore Services
              </a>

            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to banner ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  currentIndex === index
                    ? "bg-[#ff8a3d]"
                    : "bg-white/60"
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default BannerSlider;