import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Mail, MapPin, Phone } from 'lucide-react';

import ContactForm from '@/components/public/ContactForm';
import MapEmbed from '@/components/public/MapEmbed';
import PartnerInterestForm from '@/components/public/PartnerInterestForm';

const contactInfo = [
  {
    label: 'Email',
    value: 'support@homecarex.com',
    detail: 'For general questions and service support.',
    href: 'mailto:support@homecarex.com',
    icon: Mail,
  },
  {
    label: 'Phone',
    value: '+91 93902 12572',
    detail: 'Speak directly with the HomeCareX team.',
    href: 'tel:+919390212572',
    icon: Phone,
  },
  {
    label: 'Office',
    value: 'Hyderabad, Telangana',
    detail: 'HomeCareX, India.',
    href: undefined,
    icon: MapPin,
  },
];

const ContactPage: React.FC = () => {
  return (
    <div className="overflow-x-hidden bg-white text-slate-800">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/70 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:gap-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">
              <span aria-hidden="true" className="h-px w-7 bg-blue-600" />
              Get in touch
            </p>
            <h1 className="mt-5 max-w-xl text-[2.35rem] font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">
              Get in touch with <span className="text-blue-700">HomeCareX.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Have a question, need support, or want to learn more about our services? Our team is ready to help.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact-form"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Send us a message <ArrowDown aria-hidden="true" size={17} />
              </a>
              <Link
                to="/services"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:border-blue-300 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Explore services
              </Link>
            </div>
          </div>
          <aside aria-label="Contact information" className="border-t border-blue-200 pt-6 sm:pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <h2 className="text-base font-semibold text-slate-900">Reach our team</h2>
            <div className="mt-3 divide-y divide-slate-200">
              {contactInfo.map(({ label, value, detail, href, icon: Icon }) => {
                const content = (
                  <>
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                      <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                      <span className="mt-1 block break-words text-sm font-semibold text-slate-900">{value}</span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">{detail}</span>
                    </span>
                  </>
                );

                return href ? (
                  <a
                    key={label}
                    href={href}
                    className="flex gap-3 py-4 transition-colors hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={label} className="flex gap-3 py-4">
                    {content}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.82fr)] lg:gap-14">
            <div id="contact-form" className="scroll-mt-24">
              <ContactForm />
            </div>
            <aside className="pt-1">
              <div id="office" className="scroll-mt-24">
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-700">Our location</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Local care, rooted in Hyderabad.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Find HomeCareX in Hyderabad, Telangana. Our map shows the city we serve.
                </p>
              </div>
              <div className="mt-6">
                <MapEmbed />
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <MapPin aria-hidden="true" size={16} className="shrink-0 text-blue-700" />
                Hyderabad, Telangana, India
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-8 lg:py-20">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-700">Work with us</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Build better homes with HomeCareX.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Bring your skills to a growing home-services network. Tell us a little about yourself and our team can connect with you.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Learn about HomeCareX <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="w-full">
            <PartnerInterestForm />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-700">Need a quick answer?</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Find answers to common questions.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Browse answers about HomeCareX and the home services available through our platform.
            </p>
          </div>
          <Link
            to="/#faqs"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-blue-700 px-5 py-3 text-sm font-semibold text-blue-800 transition duration-200 hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:self-auto"
          >
            View FAQs <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
