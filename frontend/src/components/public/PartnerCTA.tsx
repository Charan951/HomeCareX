import React from "react";
import { Link } from "react-router-dom";

const PartnerCTA: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl bg-[#4338ca]">
          <div className="grid items-center gap-8 px-8 py-10 sm:px-12 lg:grid-cols-2 lg:px-16">

            {/* Content */}
            <div className="text-white">
              <p className="text-sm font-bold uppercase tracking-wide text-[#ff8a3d]">
                Become a Partner
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Grow Your Business With HomeCareX
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-white/80">
                Join HomeCareX and connect with customers looking for
                reliable home services. Build your professional presence
                and grow your service opportunities.
              </p>

              <Link
                to="/register"
                className="mt-7 inline-flex rounded-lg bg-[#ff8a3d] px-6 py-3 font-semibold text-white transition hover:bg-[#e0600f] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4338ca]"
              >
                Become a Partner
              </Link>
            </div>

            {/* Visual */}
            <div className="flex justify-center lg:justify-end">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/10 sm:h-56 sm:w-56">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#ff8a3d] text-center text-lg font-bold text-white sm:h-40 sm:w-40">
                  Join
                  <br />
                  HomeCareX
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;