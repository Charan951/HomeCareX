<<<<<<< Updated upstream
import React, { useState } from "react";
import { Link } from "react-router-dom";
=======
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
>>>>>>> Stashed changes

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

const Home: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const location = useLocation();

<<<<<<< Updated upstream
=======
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

  useEffect(() => {
    if (!location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  /* =========================================================
     ANIMATION CLASS
  ========================================================= */

  const revealClass = (
    id: string,
    _delay: number = 0
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

>>>>>>> Stashed changes
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-white text-gray-800">

      {/* =====================================================
          HERO SECTION
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">

        {/* Decorative Background */}

        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ff8a3d]/10 blur-3xl" />

        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#4338ca]/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT CONTENT */}

            <div>

              <span
                className="
                  inline-flex
                  items-center
                  px-4 py-2
                  rounded-full
                  bg-[#ff8a3d]/10
                  text-[#ff8a3d]
                  text-sm
                  font-bold
                  tracking-wide
                  mb-6
                "
              >
                YOUR HOME, OUR CARE
              </span>

              <h1
                className="
                  text-4xl
                  sm:text-5xl
                  lg:text-6xl
                  font-extrabold
                  text-[#4338ca]
                  leading-[1.1]
                  tracking-tight
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
                  text-base
                  sm:text-lg
                  text-gray-600
                  leading-8
                  max-w-xl
                "
              >
                HomeCareX connects you with reliable professionals
                for all your home service needs. From cleaning and
                plumbing to electrical work and maintenance, we make
                taking care of your home simple and convenient.
              </p>

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-4 mt-8">

                <a
                  href="#services"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    px-7 py-3.5
                    rounded-lg
                    bg-[#4338ca]
                    text-white
                    font-semibold
                    shadow-md
                    hover:bg-[#ff8a3d]
                    hover:-translate-y-0.5
                    transition-all
                    duration-300
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
                    px-7 py-3.5
                    rounded-lg
                    border-2
                    border-[#4338ca]
                    text-[#4338ca]
                    font-semibold
                    hover:bg-[#4338ca]
                    hover:text-white
                    hover:-translate-y-0.5
                    transition-all
                    duration-300
                  "
                >
                  Learn More
                </Link>

              </div>

              {/* STATS */}

              <div className="grid grid-cols-3 gap-5 sm:gap-8 mt-12 pt-8 border-t border-gray-200">

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#4338ca]">
                    6+
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Home Services
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#4338ca]">
                    24/7
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Support
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#4338ca]">
                    100%
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Convenience
                  </p>
                </div>

              </div>

            </div>


            {/* RIGHT IMAGE */}

            <div className="relative">

              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ff8a3d]/20 rounded-full blur-2xl" />

              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#4338ca]/20 rounded-full blur-2xl" />

              <div
                className="
                  relative
                  bg-white
                  p-3
                  rounded-3xl
                  shadow-2xl
                  border
                  border-white
                "
              >

                <img
                  src="/images/home-cleaning.jpg"
                  alt="HomeCareX Services"
                  className="
                    w-full
                    h-[320px]
                    sm:h-[400px]
                    lg:h-[470px]
                    object-cover
                    rounded-2xl
                  "
                />

                {/* Image Badge */}

                <div
                  className="
                    absolute
                    left-6
                    bottom-6
                    bg-white
                    rounded-xl
                    shadow-lg
                    px-5
                    py-4
                    border
                    border-gray-100
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
      </section>


      {/* =====================================================
          SERVICES SECTION
      ====================================================== */}

      <section
        id="services"
        className="py-20 sm:py-24 bg-gray-50"
      >

        <div className="max-w-7xl mx-auto px-6">

          {/* SECTION HEADING */}

          <div className="text-center max-w-2xl mx-auto mb-14">

            <span
              className="
                text-[#ff8a3d]
                font-bold
                text-sm
                uppercase
                tracking-widest
              "
            >
              Our Services
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-extrabold
                text-[#4338ca]
              "
            >
              Everything Your Home Needs
            </h2>

            <p className="mt-4 text-gray-600 leading-7">
              Professional home services delivered with convenience,
              reliability and care.
            </p>

          </div>


          {/* SERVICE CARDS */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-7
            "
          >

            {services.map((service) => (

              <div
                key={service.id}
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

                {/* IMAGE */}

                <div className="relative overflow-hidden">

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

                  {/* Image Overlay */}

                  <div
                    className="
                      absolute
                      inset-0
                      bg-gradient-to-t
                      from-[#4338ca]/40
                      to-transparent
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                      duration-300
                    "
                  />

                </div>


                {/* CARD CONTENT */}

                <div className="p-6">

                  <h3
                    className="
                      text-xl
                      font-bold
                      text-[#4338ca]
                      group-hover:text-[#ff8a3d]
                      transition-colors
                      duration-300
                    "
                  >
                    {service.title}
                  </h3>

                  <p
                    className="
                      mt-3
                      text-gray-600
                      leading-7
                      text-sm
                    "
                  >
                    {service.description}
                  </p>

                  <Link
                    to={`/services/${service.id}`}
                    className="
                      inline-flex
                      items-center
                      mt-5
                      text-[#ff8a3d]
                      font-bold
                      text-sm
                      hover:text-[#4338ca]
                      transition-colors
                      duration-300
                    "
                  >
                    Learn More
                    <span className="ml-1 group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </Link>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          WHY HOMECAREX
      ====================================================== */}

      <section className="py-20 sm:py-24 bg-white">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto">

            <span
              className="
                text-[#ff8a3d]
                font-bold
                text-sm
                uppercase
                tracking-widest
              "
            >
              Why HomeCareX
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-extrabold
                text-[#4338ca]
              "
            >
              Why Choose HomeCareX?
            </h2>

            <p className="mt-4 text-gray-600 leading-7">
              We make home maintenance easier, faster and more
              convenient for everyone.
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-7
              mt-14
            "
          >

            {/* CARD 1 */}

            <div
              className="
                group
                text-center
                p-8
                rounded-2xl
                bg-indigo-50
                border
                border-indigo-100
                hover:shadow-lg
                hover:-translate-y-1
                transition-all
                duration-300
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#4338ca]
                  text-white
                  text-2xl
                  shadow-md
                  group-hover:bg-[#ff8a3d]
                  transition-colors
                  duration-300
                "
              >
                🏠
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Trusted Professionals
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Connect with professionals who can help
                take care of your home.
              </p>

            </div>


            {/* CARD 2 */}

            <div
              className="
                group
                text-center
                p-8
                rounded-2xl
                bg-orange-50
                border
                border-orange-100
                hover:shadow-lg
                hover:-translate-y-1
                transition-all
                duration-300
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#ff8a3d]
                  text-white
                  text-2xl
                  shadow-md
                  group-hover:bg-[#4338ca]
                  transition-colors
                  duration-300
                "
              >
                ⭐
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Quality Service
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Get reliable and professional services
                for your home.
              </p>

            </div>


            {/* CARD 3 */}

            <div
              className="
                group
                text-center
                p-8
                rounded-2xl
                bg-indigo-50
                border
                border-indigo-100
                hover:shadow-lg
                hover:-translate-y-1
                transition-all
                duration-300
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#4338ca]
                  text-white
                  text-2xl
                  shadow-md
                  group-hover:bg-[#ff8a3d]
                  transition-colors
                  duration-300
                "
              >
                ⏱️
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Quick & Convenient
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Make your home maintenance simple and
                convenient.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="py-20 sm:py-24 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">

            <span
              className="
                text-[#ff8a3d]
                font-bold
                text-sm
                uppercase
                tracking-widest
              "
            >
              Simple Process
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-extrabold
                text-[#4338ca]
              "
            >
              How HomeCareX Works
            </h2>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* STEP 1 */}

            <div className="relative text-center">

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-full
                  bg-[#4338ca]
                  text-white
                  flex
                  items-center
                  justify-center
                  text-xl
                  font-bold
                  shadow-md
                "
              >
                1
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Choose a Service
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Select the home service you need from
                our available services.
              </p>

            </div>


            {/* STEP 2 */}

            <div className="relative text-center">

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-full
                  bg-[#ff8a3d]
                  text-white
                  flex
                  items-center
                  justify-center
                  text-xl
                  font-bold
                  shadow-md
                "
              >
                2
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Request the Service
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Provide the required details and
                submit your service request.
              </p>

            </div>


            {/* STEP 3 */}

            <div className="relative text-center">

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-full
                  bg-[#4338ca]
                  text-white
                  flex
                  items-center
                  justify-center
                  text-xl
                  font-bold
                  shadow-md
                "
              >
                3
              </div>

              <h3 className="text-xl font-bold text-[#4338ca] mt-5">
                Get Your Service
              </h3>

              <p className="text-gray-600 mt-3 leading-7">
                Connect with a professional and get
                your home service completed.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FAQ SECTION
      ====================================================== */}

<<<<<<< Updated upstream
      <section id="faqs" className="scroll-mt-24 py-20 sm:py-24 bg-white">
=======
      <section id="faqs" className="scroll-mt-24 bg-white py-20 sm:py-24">
>>>>>>> Stashed changes

        <div className="max-w-4xl mx-auto px-6">

          <div className="text-center mb-12">

            <span
              className="
                text-[#ff8a3d]
                font-bold
                text-sm
                uppercase
                tracking-widest
              "
            >
              FAQ
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-extrabold
                text-[#4338ca]
              "
            >
              Frequently Asked Questions
            </h2>

            <p className="text-gray-600 mt-4">
              Everything you need to know about HomeCareX.
            </p>

          </div>


          <div className="space-y-4">

            {faqs.map((faq, index) => (

              <div
                key={faq.question}
                className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  shadow-sm
                  hover:border-[#4338ca]/30
                  transition-all
                  duration-300
                "
              >

                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    gap-4
                    px-6
                    py-5
                    text-left
                    hover:bg-indigo-50/40
                    transition-colors
                    duration-300
                  "
                >

                  <span className="font-semibold text-[#4338ca]">
                    {faq.question}
                  </span>

                  <span
                    className="
                      flex-shrink-0
                      w-8
                      h-8
                      rounded-full
                      bg-[#ff8a3d]/10
                      text-[#ff8a3d]
                      flex
                      items-center
                      justify-center
                      text-xl
                      font-medium
                    "
                  >
                    {openFaq === index ? "−" : "+"}
                  </span>

                </button>


                {openFaq === index && (

                  <div
                    className="
                      px-6
                      pb-5
                      border-t
                      border-gray-100
                      bg-gray-50/50
                    "
                  >
                    <p className="pt-4 text-gray-600 leading-7">
                      {faq.answer}
                    </p>
                  </div>

                )}

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          CALL TO ACTION
      ====================================================== */}

      <section className="relative overflow-hidden py-20 bg-[#4338ca]">

        {/* Decorative circles */}

        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ff8a3d]/20 blur-3xl" />

        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">

          <span
            className="
              inline-block
              px-4 py-2
              rounded-full
              bg-white/10
              text-orange-200
              text-sm
              font-semibold
            "
          >
            HOMECAREX
          </span>

          <h2
            className="
              mt-5
              text-3xl
              sm:text-4xl
              md:text-5xl
              font-extrabold
              text-white
            "
          >
            Need Help With Your Home?
          </h2>

          <p
            className="
              mt-5
              text-indigo-100
              max-w-2xl
              mx-auto
              leading-7
            "
          >
            HomeCareX makes it easy to find the right
            home service for your needs.
          </p>

<<<<<<< Updated upstream
          <a
            href="#services"
            className="
              inline-flex
              items-center
              mt-8
              px-8 py-3.5
              bg-[#ff8a3d]
              text-white
              font-bold
              rounded-lg
              shadow-md
              hover:bg-white
              hover:text-[#4338ca]
              hover:-translate-y-0.5
              transition-all
              duration-300
            "
          >
            Explore Our Services
            <span className="ml-2">→</span>
          </a>
=======
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

              <Link
                to="/contact#partner-interest"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-lg
                  border-2
                  border-[#ff8a3d]
                  px-7
                  py-3.5
                  font-semibold
                  text-[#b94d0d]
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-[#ff8a3d]
                  hover:text-white
                "
              >
                Become a Partner
              </Link>

            </div>

          </div>
>>>>>>> Stashed changes

        </div>

      </section>

    </div>
  );
};

export default Home;