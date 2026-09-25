import React from "react";

const contactData = [
  {
    title: "Email",
    value: "support@homecarex.com",
    description: "Send us your questions anytime.",
    icon: "✉",
    color: "bg-[#4338ca]",
  },
  {
    title: "Phone",
    value: "+91 9390212572",
    description: "Call us for home service assistance.",
    icon: "☎",
    color: "bg-[#ff8a3d]",
  },
  {
    title: "Address",
    value: "HomeCareX Office",
    description: "Main Road, Hyderabad, Telangana, India",
    icon: "⌂",
    color: "bg-[#4338ca]",
  },
  {
    title: "Working Hours",
    value: "9:00 AM - 6:00 PM",
    description: "Monday to Saturday",
    icon: "◷",
    color: "bg-[#ff8a3d]",
  },
];

const Contact: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">

        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ff8a3d]/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#4338ca]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">

          <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
            Contact Us
          </span>

          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-[#4338ca]">
            We Are Here To Help
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-gray-600 leading-7">
            Have a question or need help with a home service?
            Get in touch with the HomeCareX team.
          </p>

        </div>

      </section>


      {/* CONTACT INFORMATION */}

      <section className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          {/* SECTION HEADING */}

          <div className="text-center max-w-2xl mx-auto">

            <span className="text-[#ff8a3d] font-bold text-sm uppercase tracking-widest">
              Get In Touch
            </span>

            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#4338ca]">
              Contact HomeCareX
            </h2>

            <p className="mt-4 text-gray-600 leading-7">
              Our team is here to help you with your questions,
              service requirements and general assistance.
            </p>

          </div>


          {/* CONTACT CARDS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">

            {contactData.map((contact) => (

              <div
                key={contact.title}
                className="
                  bg-white
                  rounded-2xl
                  p-7
                  border
                  border-gray-100
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  duration-300
                "
              >

                {/* ICON */}

                <div
                  className={`
                    w-14
                    h-14
                    rounded-xl
                    ${contact.color}
                    text-white
                    flex
                    items-center
                    justify-center
                    text-2xl
                  `}
                >
                  {contact.icon}
                </div>


                {/* TITLE */}

                <h3 className="mt-6 text-xl font-bold text-[#4338ca]">
                  {contact.title}
                </h3>


                {/* VALUE */}

                <p className="mt-3 font-semibold text-gray-800">
                  {contact.value}
                </p>


                {/* DESCRIPTION */}

                <p className="mt-2 text-sm text-gray-500 leading-6">
                  {contact.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* SUPPORT SECTION */}

      <section className="pb-20">

        <div className="max-w-5xl mx-auto px-6">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 sm:p-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#4338ca] text-white flex items-center justify-center text-3xl">
              ?
            </div>

            <h2 className="mt-6 text-3xl font-bold text-[#4338ca]">
              Need Assistance?
            </h2>

            <p className="mt-4 max-w-2xl mx-auto text-gray-600 leading-7">
              Our HomeCareX support team is available to help you
              with service-related questions and other assistance.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-4">

              <div className="px-6 py-3 rounded-lg bg-indigo-50 text-[#4338ca] font-semibold">
                📧 support@homecarex.com
              </div>

              <div className="px-6 py-3 rounded-lg bg-orange-50 text-[#ff8a3d] font-semibold">
                ☎ +91 9390212572
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* BOTTOM CTA */}

      <section className="bg-[#4338ca] py-16">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            HomeCareX Is Here For You
          </h2>

          <p className="mt-4 text-indigo-100 leading-7">
            Get reliable home services with a simple and convenient
            experience.
          </p>

          <a
            href="tel:+919390212572"
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
            Call HomeCareX
            <span className="ml-2">→</span>
          </a>

        </div>

      </section>

    </div>
  );
};

export default Contact;