import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   SERVICES DATA
========================================================= */

const services = [
  {
    id: "home-cleaning",
    title: "Home Cleaning",
    description:
      "Professional cleaning services to keep your home clean, fresh and comfortable.",
    image: "/images/home-cleaning.jpg",
  },
  {
    id: "plumbing",
    title: "Plumbing Services",
    description:
      "Reliable plumbing services for leaks, repairs, installations and maintenance.",
    image: "/images/plumbing.jpg",
  },
  {
    id: "electrical",
    title: "Electrical Services",
    description:
      "Safe and professional electrical services for your home.",
    image: "/images/electrical.jpg",
  },
  {
    id: "painting",
    title: "Painting Services",
    description:
      "Professional painting services to give your home a fresh and beautiful look.",
    image: "/images/painting.jpg",
  },
  {
    id: "appliance-repair",
    title: "Appliance Repair",
    description:
      "Quick and reliable repair services for your household appliances.",
    image: "/images/appliance-repair.jpg",
  },
  {
    id: "home-maintenance",
    title: "Home Maintenance",
    description:
      "Complete maintenance services to keep your home safe and comfortable.",
    image: "/images/home-maintenance.jpg",
  },
];

/* =========================================================
   FAQ DATA
========================================================= */

const faqs = [
  {
    question: "What services does HomeCareX provide?",
    answer:
      "HomeCareX provides home cleaning, plumbing, electrical services, painting, appliance repair and home maintenance services.",
  },
  {
    question: "How can I book a service?",
    answer:
      "You can browse the services available on HomeCareX and select the service you need. You can then continue with the service request process.",
  },
  {
    question: "Can I choose a specific service?",
    answer:
      "Yes. HomeCareX allows customers to select the particular home service they require.",
  },
  {
    question: "How do I contact HomeCareX?",
    answer:
      "You can contact HomeCareX through the Contact section of the website for assistance.",
  },
  {
    question: "Are HomeCareX services available for regular maintenance?",
    answer:
      "Yes. HomeCareX provides home maintenance services to help keep your home safe and comfortable.",
  },
];

/* =========================================================
   HOME COMPONENT
========================================================= */

const Home: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /*
    Store which elements have already appeared.
    We use a Set so an element animates only once.
  */
  const [visibleItems, setVisibleItems] = useState<Set<string>>(
    new Set()
  );

  /*
    IntersectionObserver reference
  */
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* =========================================================
     SCROLL ANIMATION
  ========================================================= */

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const animationId = element.dataset.animationId;

            if (!animationId) return;

            setVisibleItems((previous) => {
              const updated = new Set(previous);
              updated.add(animationId);
              return updated;
            });

            observerRef.current?.unobserve(element);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const elements = document.querySelectorAll(
      "[data-scroll-animation]"
    );

    elements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  /* =========================================================
     ANIMATION CLASS
  ========================================================= */

  const revealClass = (
    id: string,
    delay: number = 0
  ): string => {
    const isVisible = visibleItems.has(id);

    return `
      transition-all
      ease-out
      duration-700
      ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-12 opacity-0"
      }
    `;
  };

  /* =========================================================
     FAQ TOGGLE
  ========================================================= */

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-white text-gray-800">

      {/* =====================================================
          HERO SECTION
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">

        {/* Orange Blob */}
        <div
          className="
            pointer-events-none
            absolute
            -top-32
            -right-32
            h-96
            w-96
            rounded-full
            bg-[#ff8a3d]/20
            blur-3xl
            animate-blob
          "
        />

        {/* Indigo Blob */}
        <div
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-32
            h-96
            w-96
            rounded-full
            bg-[#4338ca]/20
            blur-3xl
            animate-blob-slow
          "
        />

        {/* Center Blob */}
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-64
            w-64
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#ff8a3d]/10
            blur-3xl
            animate-floaty
          "
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* =================================================
                HERO LEFT
            ================================================== */}

            <div
              data-scroll-animation
              data-animation-id="hero-content"
              className={revealClass("hero-content")}
            >

              <span
                className="
                  mb-6
                  inline-flex
                  items-center
                  rounded-full
                  bg-[#ff8a3d]/10
                  px-4
                  py-2
                  text-sm
                  font-bold
                  tracking-wide
                  text-[#ff8a3d]
                "
              >
                YOUR HOME, OUR CARE
              </span>

              <h1
                className="
                  text-4xl
                  font-extrabold
                  leading-[1.1]
                  tracking-tight
                  text-[#4338ca]
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Professional Care
                <br />

                <span className="text-[#ff8a3d]">
                  For Your Home
                </span>
              </h1>

              <p
                className="
                  mt-6
                  max-w-xl
                  text-base
                  leading-8
                  text-gray-600
                  sm:text-lg
                "
              >
                HomeCareX connects you with reliable professionals
                for all your home service needs. From cleaning and
                plumbing to electrical work and maintenance, we make
                taking care of your home simple and convenient.
              </p>

              {/* Buttons */}

              <div className="mt-8 flex flex-wrap gap-4">

                <a
                  href="#services"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#4338ca]
                    px-7
                    py-3.5
                    font-semibold
                    text-white
                    shadow-md
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-[#ff8a3d]
                  "
                >
                  Explore Services
                  <span className="ml-2">→</span>
                </a>

                <Link
                  to="/about"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-lg
                    border-2
                    border-[#4338ca]
                    px-7
                    py-3.5
                    font-semibold
                    text-[#4338ca]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-[#4338ca]
                    hover:text-white
                  "
                >
                  Learn More
                </Link>

              </div>

              {/* Stats */}

              <div
                className="
                  mt-12
                  grid
                  grid-cols-3
                  gap-5
                  border-t
                  border-gray-200
                  pt-8
                  sm:gap-8
                "
              >

                <div>
                  <h3 className="text-2xl font-extrabold text-[#4338ca] sm:text-3xl">
                    6+
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Home Services
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#4338ca] sm:text-3xl">
                    24/7
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Support
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#4338ca] sm:text-3xl">
                    100%
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Convenience
                  </p>
                </div>

              </div>

            </div>


            {/* =================================================
                HERO IMAGE
            ================================================== */}

            <div
              data-scroll-animation
              data-animation-id="hero-image"
              className={revealClass("hero-image")}
            >

              <div className="relative">

                {/* Orange Blob */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    -top-10
                    h-40
                    w-40
                    rounded-full
                    bg-[#ff8a3d]/30
                    blur-2xl
                    animate-floaty
                  "
                />

                {/* Indigo Blob */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -bottom-10
                    -left-10
                    h-48
                    w-48
                    rounded-full
                    bg-[#4338ca]/30
                    blur-2xl
                    animate-blob-slow
                  "
                />

                {/* Image Card */}

                <div
                  className="
                    group
                    relative
                    rounded-3xl
                    border
                    border-white
                    bg-white
                    p-3
                    shadow-2xl
                    transition-all
                    duration-500
                    hover:-translate-y-2
                    hover:shadow-3xl
                  "
                >

                  <img
                    src="/images/home-cleaning.jpg"
                    alt="HomeCareX Services"
                    className="
                      h-[320px]
                      w-full
                      rounded-2xl
                      object-cover
                      transition-transform
                      duration-700
                      group-hover:scale-[1.03]
                      sm:h-[400px]
                      lg:h-[470px]
                    "
                  />

                  {/* Image Badge */}

                  <div
                    className="
                      absolute
                      bottom-6
                      left-6
                      rounded-xl
                      border
                      border-gray-100
                      bg-white
                      px-5
                      py-4
                      shadow-lg
                      transition-transform
                      duration-500
                      group-hover:-translate-y-1
                    "
                  >
                    <p className="text-xs text-gray-500">
                      Trusted Home Care
                    </p>

                    <p className="text-lg font-bold text-[#4338ca]">
                      Simple. Reliable. Convenient.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          SERVICES SECTION
      ====================================================== */}

      <section
        id="services"
        className="bg-gray-50 py-20 sm:py-24"
      >

        <div className="mx-auto max-w-7xl px-6">

          {/* Section Heading */}

          <div
            data-scroll-animation
            data-animation-id="services-heading"
            className={revealClass("services-heading")}
          >

            <div className="mx-auto mb-14 max-w-2xl text-center">

              <span
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-widest
                  text-[#ff8a3d]
                "
              >
                Our Services
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  text-[#4338ca]
                  sm:text-4xl
                "
              >
                Everything Your Home Needs
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                Professional home services delivered with convenience,
                reliability and care.
              </p>

            </div>

          </div>


          {/* Service Cards */}

          <div
            className="
              grid
              grid-cols-1
              gap-7
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {services.map((service, index) => {

              const animationId = `service-${service.id}`;

              return (
                <div
                  key={service.id}
                  data-scroll-animation
                  data-animation-id={animationId}
                  className={revealClass(animationId)}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >

                  <div
                    className="
                      group
                      h-full
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-100
                      bg-white
                      shadow-sm
                      transition-all
                      duration-500
                      hover:-translate-y-3
                      hover:shadow-2xl
                    "
                  >

                    {/* Image */}

                    <div className="relative overflow-hidden">

                      <img
                        src={service.image}
                        alt={service.title}
                        className="
                          h-56
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-110
                        "
                      />

                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-[#4338ca]/50
                          to-transparent
                          opacity-0
                          transition-opacity
                          duration-500
                          group-hover:opacity-100
                        "
                      />

                    </div>


                    {/* Content */}

                    <div className="p-6">

                      <h3
                        className="
                          text-xl
                          font-bold
                          text-[#4338ca]
                          transition-colors
                          duration-300
                          group-hover:text-[#ff8a3d]
                        "
                      >
                        {service.title}
                      </h3>

                      <p
                        className="
                          mt-3
                          text-sm
                          leading-7
                          text-gray-600
                        "
                      >
                        {service.description}
                      </p>

                      <Link
                        to={`/services/${service.id}`}
                        className="
                          mt-5
                          inline-flex
                          items-center
                          text-sm
                          font-bold
                          text-[#ff8a3d]
                          transition-colors
                          duration-300
                          hover:text-[#4338ca]
                        "
                      >
                        Learn More

                        <span
                          className="
                            ml-1
                            transition-transform
                            duration-300
                            group-hover:translate-x-2
                          "
                        >
                          →
                        </span>
                      </Link>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        </div>
      </section>


      {/* =====================================================
          WHY HOMECAREX
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24">

        <div className="mx-auto max-w-7xl px-6">

          {/* Heading */}

          <div
            data-scroll-animation
            data-animation-id="why-heading"
            className={revealClass("why-heading")}
          >

            <div className="mx-auto max-w-2xl text-center">

              <span
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-widest
                  text-[#ff8a3d]
                "
              >
                Why HomeCareX
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  text-[#4338ca]
                  sm:text-4xl
                "
              >
                Why Choose HomeCareX?
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                We make home maintenance easier, faster and more
                convenient for everyone.
              </p>

            </div>

          </div>


          {/* Cards */}

          <div
            className="
              mt-14
              grid
              grid-cols-1
              gap-7
              md:grid-cols-3
            "
          >

            {/* Card 1 */}

            <div
              data-scroll-animation
              data-animation-id="why-card-1"
              className={revealClass("why-card-1")}
              style={{ transitionDelay: "0ms" }}
            >

              <div
                className="
                  group
                  h-full
                  rounded-2xl
                  border
                  border-indigo-100
                  bg-indigo-50
                  p-8
                  text-center
                  transition-all
                  duration-500
                  hover:-translate-y-3
                  hover:shadow-xl
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#4338ca]
                    text-2xl
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    group-hover:rotate-6
                    group-hover:scale-110
                    group-hover:bg-[#ff8a3d]
                  "
                >
                  🏠
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Trusted Professionals
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Connect with professionals who can help
                  take care of your home.
                </p>

              </div>

            </div>


            {/* Card 2 */}

            <div
              data-scroll-animation
              data-animation-id="why-card-2"
              className={revealClass("why-card-2")}
              style={{ transitionDelay: "150ms" }}
            >

              <div
                className="
                  group
                  h-full
                  rounded-2xl
                  border
                  border-orange-100
                  bg-orange-50
                  p-8
                  text-center
                  transition-all
                  duration-500
                  hover:-translate-y-3
                  hover:shadow-xl
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#ff8a3d]
                    text-2xl
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    group-hover:rotate-6
                    group-hover:scale-110
                    group-hover:bg-[#4338ca]
                  "
                >
                  ⭐
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Quality Service
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Get reliable and professional services
                  for your home.
                </p>

              </div>

            </div>


            {/* Card 3 */}

            <div
              data-scroll-animation
              data-animation-id="why-card-3"
              className={revealClass("why-card-3")}
              style={{ transitionDelay: "300ms" }}
            >

              <div
                className="
                  group
                  h-full
                  rounded-2xl
                  border
                  border-indigo-100
                  bg-indigo-50
                  p-8
                  text-center
                  transition-all
                  duration-500
                  hover:-translate-y-3
                  hover:shadow-xl
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#4338ca]
                    text-2xl
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    group-hover:rotate-6
                    group-hover:scale-110
                    group-hover:bg-[#ff8a3d]
                  "
                >
                  ⏱️
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Quick & Convenient
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Make your home maintenance simple and
                  convenient.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="bg-gray-50 py-20 sm:py-24">

        <div className="mx-auto max-w-7xl px-6">

          {/* Heading */}

          <div
            data-scroll-animation
            data-animation-id="process-heading"
            className={revealClass("process-heading")}
          >

            <div className="mb-14 text-center">

              <span
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-widest
                  text-[#ff8a3d]
                "
              >
                Simple Process
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  text-[#4338ca]
                  sm:text-4xl
                "
              >
                How HomeCareX Works
              </h2>

            </div>

          </div>


          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

            {/* Step 1 */}

            <div
              data-scroll-animation
              data-animation-id="step-1"
              className={revealClass("step-1")}
            >

              <div className="relative text-center">

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-[#4338ca]
                    text-xl
                    font-bold
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    hover:scale-110
                    hover:rotate-6
                  "
                >
                  1
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Choose a Service
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Select the home service you need from
                  our available services.
                </p>

              </div>

            </div>


            {/* Step 2 */}

            <div
              data-scroll-animation
              data-animation-id="step-2"
              className={revealClass("step-2")}
              style={{ transitionDelay: "150ms" }}
            >

              <div className="relative text-center">

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-[#ff8a3d]
                    text-xl
                    font-bold
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    hover:scale-110
                    hover:rotate-6
                  "
                >
                  2
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Request the Service
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Provide the required details and
                  submit your service request.
                </p>

              </div>

            </div>


            {/* Step 3 */}

            <div
              data-scroll-animation
              data-animation-id="step-3"
              className={revealClass("step-3")}
              style={{ transitionDelay: "300ms" }}
            >

              <div className="relative text-center">

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-[#4338ca]
                    text-xl
                    font-bold
                    text-white
                    shadow-md
                    transition-all
                    duration-500
                    hover:scale-110
                    hover:rotate-6
                  "
                >
                  3
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                  Get Your Service
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  Connect with a professional and get
                  your home service completed.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          FAQ SECTION
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24">

        <div className="mx-auto max-w-4xl px-6">

          {/* FAQ Heading */}

          <div
            data-scroll-animation
            data-animation-id="faq-heading"
            className={revealClass("faq-heading")}
          >

            <div className="mb-12 text-center">

              <span
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-widest
                  text-[#ff8a3d]
                "
              >
                FAQ
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  text-[#4338ca]
                  sm:text-4xl
                "
              >
                Frequently Asked Questions
              </h2>

              <p className="mt-4 text-gray-600">
                Everything you need to know about HomeCareX.
              </p>

            </div>

          </div>


          <div className="space-y-4">

            {faqs.map((faq, index) => {

              const animationId = `faq-${index}`;

              return (
                <div
                  key={faq.question}
                  data-scroll-animation
                  data-animation-id={animationId}
                  className={revealClass(animationId)}
                  style={{
                    transitionDelay: `${index * 80}ms`,
                  }}
                >

                  <div
                    className="
                      overflow-hidden
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                      transition-all
                      duration-300
                      hover:border-[#4338ca]/30
                      hover:shadow-md
                    "
                  >

                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-4
                        px-6
                        py-5
                        text-left
                        transition-colors
                        duration-300
                        hover:bg-indigo-50/40
                      "
                    >

                      <span className="font-semibold text-[#4338ca]">
                        {faq.question}
                      </span>

                      <span
                        className="
                          flex
                          h-8
                          w-8
                          flex-shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[#ff8a3d]/10
                          text-xl
                          font-medium
                          text-[#ff8a3d]
                        "
                      >
                        {openFaq === index ? "−" : "+"}
                      </span>

                    </button>


                    {openFaq === index && (

                      <div
                        className="
                          border-t
                          border-gray-100
                          bg-gray-50/50
                          px-6
                          pb-5
                        "
                      >

                        <p className="pt-4 leading-7 text-gray-600">
                          {faq.answer}
                        </p>

                      </div>

                    )}

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* =====================================================
          CTA SECTION
          WHITE BACKGROUND
      ====================================================== */}

      <section
        className="
          relative
          overflow-hidden
          bg-white
          py-20
        "
      >

        {/* Orange Blob */}

        <div
          className="
            pointer-events-none
            absolute
            -right-32
            -top-32
            h-96
            w-96
            rounded-full
            bg-[#ff8a3d]/10
            blur-3xl
            animate-blob
          "
        />

        {/* Indigo Blob */}

        <div
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-32
            h-96
            w-96
            rounded-full
            bg-[#4338ca]/10
            blur-3xl
            animate-blob-slow
          "
        />


        <div
          data-scroll-animation
          data-animation-id="cta"
          className={revealClass("cta")}
        >

          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">

            {/* Label */}

            <span
              className="
                inline-block
                rounded-full
                bg-gray-100
                px-4
                py-2
                text-sm
                font-bold
                tracking-wide
                text-[#4338ca]
              "
            >
              HOMECAREX
            </span>


            {/* Heading */}

            <h2
              className="
                mt-5
                text-3xl
                font-extrabold
                text-[#4338ca]
                sm:text-4xl
                lg:text-5xl
              "
            >
              Take Care of Your Home
              <br />
              With Confidence
            </h2>


            {/* Description */}

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                leading-7
                text-gray-600
              "
            >
              Find reliable home services and make your
              home maintenance simple and convenient.
            </p>


            {/* Buttons */}

            <div className="mt-8 flex flex-wrap justify-center gap-4">

              <Link
                to="/services"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#ff8a3d]
                  px-7
                  py-3.5
                  font-semibold
                  text-white
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-[#4338ca]
                "
              >
                Explore Services
              </Link>

              <Link
                to="/contact"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-lg
                  border-2
                  border-[#4338ca]
                  px-7
                  py-3.5
                  font-semibold
                  text-[#4338ca]
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-[#4338ca]
                  hover:text-white
                "
              >
                Contact Us
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Home;