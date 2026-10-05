import React from "react";

/**
 * TrustStrip: the single "Why choose HomeCareX?" section.
 * It is rendered inside the `.hcx` wrapper in Home.tsx, so the fonts,
 * colours and `display` heading class come from there.
 */

const points = [
  { icon: "🛡️", title: "Reliable professionals", text: "Connect with skilled people who take care of your home." },
  { icon: "📅", title: "Easy booking", text: "Find a service and choose a time that suits you." },
  { icon: "🏠", title: "Convenient service", text: "Manage all your home service needs in one place." },
  { icon: "⭐", title: "Quality focused", text: "Reliable, professional work you can count on, every time." },
];

const TrustStrip: React.FC = () => (
  <section className="bg-white py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          Why choose HomeCareX?
        </h2>
        <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">
          We make home maintenance easier, faster and more convenient for everyone.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => (
          <div
            key={p.title}
            className="group h-full rounded-3xl bg-[#eef0ff] p-8 ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-2 hover:bg-white hover:shadow-xl"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4338ca] text-2xl shadow-md transition duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-[#ff8a3d]"
              aria-hidden
            >
              {p.icon}
            </div>
            <h3 className="mt-6 text-xl font-bold text-[#1e1b6e]">{p.title}</h3>
            <p className="mt-3 leading-7 text-[#5b5b7a]">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustStrip;