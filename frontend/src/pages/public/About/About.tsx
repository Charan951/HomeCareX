import React from "react";
import { Link } from "react-router-dom";

const About: React.FC = () => {
  return (
    <div className="bg-white">

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">

        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ff8a3d]/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#4338ca]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">

          <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
            About HomeCareX
          </span>

          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-[#4338ca]">
            Your Home, Our Care
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-gray-600 leading-7">
            HomeCareX makes it easier to find reliable services
            for your everyday home needs.
          </p>

        </div>

      </section>


      {/* ABOUT CONTENT */}

      <section className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* IMAGE */}

            <div className="relative">

              <div className="absolute -top-5 -left-5 w-24 h-24 bg-[#ff8a3d]/20 rounded-full blur-2xl" />

              <div className="relative bg-white p-3 rounded-3xl shadow-xl border border-gray-100">

                <img
                  src="/images/home-maintenance.jpg"
                  alt="HomeCareX"
                  className="w-full h-[400px] object-cover rounded-2xl"
                />

              </div>

            </div>


            {/* CONTENT */}

            <div>

              <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
                Who We Are
              </span>

              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#4338ca]">
                Making Home Care Simple
              </h2>

              <p className="mt-6 text-gray-600 leading-8">
                HomeCareX is a home service platform designed to
                make everyday home maintenance easier and more
                convenient.
              </p>

              <p className="mt-4 text-gray-600 leading-8">
                From cleaning and plumbing to electrical services,
                painting, appliance repair and maintenance, we
                bring different home service needs together in
                one convenient place.
              </p>

              <Link
                to="/services"
                className="
                  inline-flex
                  items-center
                  mt-7
                  px-7
                  py-3
                  rounded-lg
                  bg-[#4338ca]
                  text-white
                  font-semibold
                  hover:bg-[#ff8a3d]
                  transition-all
                  duration-300
                "
              >
                Explore Services
                <span className="ml-2">→</span>
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* VALUES */}

      <section className="py-20 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto">

            <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
              Our Values
            </span>

            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#4338ca]">
              What We Focus On
            </h2>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">

              <div className="w-14 h-14 mx-auto rounded-xl bg-[#4338ca] text-white flex items-center justify-center text-2xl">
                ✓
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                Reliability
              </h3>

              <p className="mt-3 text-gray-600 leading-7">
                We focus on providing dependable home service
                solutions.
              </p>

            </div>


            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">

              <div className="w-14 h-14 mx-auto rounded-xl bg-[#ff8a3d] text-white flex items-center justify-center text-2xl">
                ★
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                Quality
              </h3>

              <p className="mt-3 text-gray-600 leading-7">
                We aim to make every home service experience
                simple and professional.
              </p>

            </div>


            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">

              <div className="w-14 h-14 mx-auto rounded-xl bg-[#4338ca] text-white flex items-center justify-center text-2xl">
                ♥
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#4338ca]">
                Customer Care
              </h3>

              <p className="mt-3 text-gray-600 leading-7">
                We put convenience and customer needs at the
                center of the experience.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* CTA */}

      <section className="py-16 bg-[#4338ca]">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Let Us Take Care of Your Home
          </h2>

          <p className="mt-4 text-indigo-100">
            Explore our services and find the right solution
            for your home.
          </p>

          <Link
            to="/services"
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
            Explore Services
            <span className="ml-2">→</span>
          </Link>

        </div>

      </section>

    </div>
  );
};

export default About;