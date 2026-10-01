import React, { useEffect } from 'react';
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import ContactForm from '@/components/public/ContactForm';
import MapEmbed from '@/components/public/MapEmbed';
import PartnerInterestForm from '@/components/public/PartnerInterestForm';
import './Contact.css';

const contactItems = [
  {
    label: 'Call',
    title: 'Talk to our team',
    detail: '+91 93902 12572',
    href: 'tel:+919390212572',
    note: 'Monday–Saturday, 9:00 AM–6:00 PM',
    icon: Phone,
  },
  {
    label: 'Email',
    title: 'Write us a note',
    detail: 'support@homecarex.com',
    href: 'mailto:support@homecarex.com',
    note: 'We’ll get back to you as soon as we can.',
    icon: Mail,
  },
  {
    label: 'Office',
    title: 'Find our office',
    detail: 'Hyderabad, Telangana',
    href: '#office',
    note: 'Get in touch before visiting.',
    icon: MapPin,
  },
  {
    label: 'Support hours',
    title: 'We’re here to help',
    detail: 'Monday–Saturday',
    href: '#contact-form',
    note: '9:00 AM–6:00 PM',
    icon: Clock3,
  },
] as const;

const Contact: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <div className="contact-page">
      <section id="contact-methods" className="contact-ways" aria-labelledby="contact-ways-title">
        <div className="contact-shell">
          <div className="contact-section-heading">
            <div>
              <p className="contact-eyebrow"><span />Choose your way in</p>
              <h1 id="contact-ways-title">Reach us directly.</h1>
            </div>
            <p>Whether it’s a quick question or a bigger conversation, we’re listening.</p>
          </div>
          <div className="contact-ways__grid">
            {contactItems.map(({ label, title, detail, href, note, icon: Icon }) => (
              <a key={label} href={href} className="contact-way">
                <span className="contact-way__top"><Icon aria-hidden="true" size={17} /><span>{label}</span><ArrowRight aria-hidden="true" size={15} /></span>
                <span className="contact-way__title">{title}</span>
                <span className="contact-way__action">{detail}</span>
                <span className="contact-way__note">{note}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-faq" aria-labelledby="contact-faq-title">
        <div className="contact-shell contact-faq__inner">
          <span className="contact-faq__icon"><MessageCircle aria-hidden="true" size={20} /></span>
          <div className="contact-faq__copy">
            <p className="contact-eyebrow"><span />Frequently asked questions</p>
            <h2 id="contact-faq-title">Still have questions?</h2>
            <p>Find answers about HomeCareX services and getting started.</p>
            <Link to="/#faqs" className="contact-faq__link">View FAQs <ArrowRight aria-hidden="true" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="contact-conversation" aria-labelledby="contact-form-heading">
        <div className="contact-shell contact-conversation__layout">
          <aside className="contact-conversation__aside">
            <p className="contact-eyebrow"><span />Start a conversation</p>
            <h2 id="contact-form-heading">Tell us what’s on your mind.</h2>
            <p>Send a few details and the HomeCareX team will take it from there. Your enquiry is shared with our team, not posted publicly.</p>
            <a className="contact-conversation__direct" href="tel:+919390212572">
              <span className="contact-conversation__direct-icon"><Phone aria-hidden="true" size={17} /></span>
              <span><small>Prefer to call?</small><b>+91 93902 12572</b></span>
              <ArrowRight aria-hidden="true" size={16} />
            </a>
            <div className="contact-conversation__hours"><Clock3 aria-hidden="true" size={16} /><span>Monday–Saturday<small>9:00 AM–6:00 PM</small></span></div>
          </aside>
          <ContactForm />
        </div>
      </section>

      <section className="contact-office-band" aria-labelledby="contact-office-title">
        <div id="office" className="contact-office contact-shell">
          <div className="contact-office__copy">
            <p className="contact-eyebrow"><span />A local point of contact</p>
            <h2 id="contact-office-title">Rooted in Hyderabad.<br /><span>Here for your home.</span></h2>
            <p>HomeCareX is based in Hyderabad, Telangana. Reach out before visiting so we can make sure someone is available to meet you.</p>
            <div className="contact-office__address"><span><MapPin aria-hidden="true" size={18} /></span><div><b>HomeCareX Office</b><small>Hyderabad, Telangana, India</small></div></div>
            <a className="contact-office__link" href="https://www.openstreetmap.org/?mlat=17.385&mlon=78.4867#map=12/17.385/78.4867" target="_blank" rel="noreferrer">Open in OpenStreetMap <ArrowRight aria-hidden="true" size={15} /></a>
          </div>
          <div className="contact-office__map"><MapEmbed /><span className="contact-office__map-label"><MapPin aria-hidden="true" size={14} /> HYDERABAD, TELANGANA</span></div>
        </div>
      </section>

      <section className="partner-band" aria-labelledby="partner-band-title">
        <div className="contact-shell partner-band__layout">
          <div className="partner-band__copy">
            <p className="contact-eyebrow contact-eyebrow--light"><span />For home-service professionals</p>
            <h2 id="partner-band-title">Bring your craft.<br /><span>Build what’s next.</span></h2>
            <p>Join the HomeCareX network and let customers discover the services you provide. Tell us about your experience and location — our team will follow up personally.</p>
            <Link to="#partner-interest" className="partner-band__cta">Become a Partner <ArrowRight aria-hidden="true" size={17} /></Link>
            <div className="partner-band__note"><ShieldCheck aria-hidden="true" size={16} /><span><b>A conversation, not a commitment.</b><small>This enquiry does not create an account or sign you up for anything.</small></span></div>
          </div>
          <div className="partner-band__form">
            <div className="partner-band__form-head"><span>PARTNER ENQUIRY</span><span>01 <i /> 02 <i /> 03</span></div>
            <PartnerInterestForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
