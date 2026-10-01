import { ROUTES } from "../constants/routes";

/* =========================================================================
   TYPES: HOMECAREX ABOUT PAGE CONTENT
   Strictly adheres to verified platform capabilities with zero unsupported claims.
   ========================================================================= */

export interface AboutHeroHighlight {
  icon: string;
  title: string;
  subtitle: string;
}

export interface AboutHeroContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  image?: {
    src: string;
    alt: string;
  };
  highlights: AboutHeroHighlight[];
}

export interface AboutStoryChallenge {
  title: string;
  description: string;
}

export interface AboutStoryContent {
  eyebrow: string;
  heading: string;
  introQuote: string;
  paragraphs: string[];
  challengesTitle: string;
  challenges: AboutStoryChallenge[];
  image: {
    src: string;
    alt: string;
  };
}

export interface AboutFeaturedService {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  icon: string;
  ctaText: string;
  href: string;
}

export interface AboutWhatWeDoContent {
  eyebrow: string;
  heading: string;
  description: string;
  services: AboutFeaturedService[];
}

export interface AboutMissionPillar {
  title: string;
  description: string;
  icon: string;
}

export interface AboutMissionContent {
  eyebrow: string;
  heading: string;
  statement: string;
  supportingText: string;
  pillars: AboutMissionPillar[];
}

export interface AboutVisionCommitment {
  title: string;
  description: string;
}

export interface AboutVisionContent {
  eyebrow: string;
  heading: string;
  statement: string;
  aspirationalNote: string;
  commitments: AboutVisionCommitment[];
}

export interface AboutTrustPractice {
  title: string;
  description: string;
  tag: string;
  icon: string;
}

export interface AboutTrustContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  subtleNote: string;
  practices: AboutTrustPractice[];
  faqCta: {
    heading: string;
    description: string;
    buttonLabel: string;
    href: string;
  };
}

export interface AboutQualityStep {
  step: string;
  title: string;
  description: string;
}

export interface AboutQualityContent {
  eyebrow: string;
  heading: string;
  supportingMessage: string;
  description: string;
  steps: AboutQualityStep[];
}

export interface AboutTeamDiscipline {
  id: string;
  title: string;
  scope: string;
  description: string;
  focusAreas: string[];
  icon: string;
}

export interface AboutTeamContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  intro: string;
  disciplines: AboutTeamDiscipline[];
}

export interface AboutValueItem {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
}

export interface AboutValuesContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  items: AboutValueItem[];
}

export interface AboutHowItWorksStep {
  number: string;
  title: string;
  summary: string;
  description: string;
  details: string[];
  icon: string;
}

export interface AboutHowItWorksContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  steps: AboutHowItWorksStep[];
}

export interface AboutCtaContent {
  heading: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
}

export interface AboutPageData {
  hero: AboutHeroContent;
  story: AboutStoryContent;
  whatWeDo: AboutWhatWeDoContent;
  mission: AboutMissionContent;
  vision: AboutVisionContent;
  trust: AboutTrustContent;
  quality: AboutQualityContent;
  team: AboutTeamContent;
  values: AboutValuesContent;
  howItWorks: AboutHowItWorksContent;
  cta: AboutCtaContent;
}

/* =========================================================================
   CONTENT DEFINITIONS
   ========================================================================= */

export const aboutData: AboutPageData = {
  /* 1. HERO */
  hero: {
    title: "About HomeCareX",
    subtitle: "Making Home Services Simpler, One Booking at a Time.",
    description:
      "HomeCareX is an on-demand home-services marketplace connecting customers with service partners. Our platform is designed to make finding, scheduling, and managing essential home services simpler, clearer, and more organized.",
    primaryCta: {
      label: "Explore Services",
      href: ROUTES.SERVICES,
    },
    secondaryCta: {
      label: "Become a Partner",
      href: `${ROUTES.CONTACT}#partner-interest`,
    },
    highlights: [
      {
        icon: "🔍",
        title: "Direct Discovery",
        subtitle: "Clear service scopes & itemized pricing",
      },
      {
        icon: "📅",
        title: "Structured Booking",
        subtitle: "Transparent scheduling & slot protection",
      },
      {
        icon: "🔄",
        title: "Tracked Workflows",
        subtitle: "Traceable progress from request to completion",
      },
    ],
  },

  /* 2. OUR STORY */
  story: {
    eyebrow: "Our Purpose & Background",
    heading: "Our Story",
    introQuote:
      "HomeCareX was created around a simple idea: accessing everyday home services should feel easier, clearer, and more organized.",
    paragraphs: [
      "In many communities, finding dependable assistance for everyday home maintenance—from plumbing and electrical repairs to residential cleaning—often involves fragmented inquiries, uncertain arrival schedules, and unclear pricing details.",
      "At the same time, skilled service professionals often lack a structured digital platform through which customers can discover and request their services directly without unnecessary friction.",
      "We built HomeCareX as a centralized digital marketplace to address these everyday challenges. Our platform enables customers to browse clear service catalogs with published scopes, while providing service professionals with an organized channel to manage and fulfill service opportunities.",
    ],
    challengesTitle: "The real challenges we focus on solving:",
    challenges: [
      {
        title: "Inconvenient Service Discovery",
        description:
          "Finding suitable assistance often requires calling multiple contacts with uncertain rates and unclear service scopes.",
      },
      {
        title: "Booking & Coordination Friction",
        description:
          "Scheduling appointments manually can lead to misunderstandings around timing, requirements, and job status.",
      },
      {
        title: "Need for Digital Structure",
        description:
          "Independent service professionals benefit from an organized digital workflow to receive requests and manage bookings efficiently.",
      },
    ],
    image: {
      src: "/images/home-cleaning.jpg",
      alt: "Resident reviewing clear home service details on a mobile device",
    },
  },

  /* 3. WHAT WE DO */
  whatWeDo: {
    eyebrow: "WHAT WE DO",
    heading: "Home Services, Made Simpler",
    description:
      "HomeCareX is a digital platform connecting customers who need everyday home services with independent service partners. We make finding, scheduling, and managing essential home services clear, reliable, and accessible.",
    services: [
      {
        id: "home-cleaning",
        name: "Cleaning",
        category: "Essential Care",
        description:
          "Professional home cleaning services for everyday spaces and essential cleaning needs.",
        image: "/images/home-cleaning.jpg",
        icon: "✨",
        ctaText: "Explore",
        href: ROUTES.SERVICES,
      },
      {
        id: "plumbing",
        name: "Plumbing",
        category: "Repairs & Installs",
        description:
          "Get help with common plumbing requirements and household maintenance.",
        image: "/images/plumbing.jpg",
        icon: "🔧",
        ctaText: "Explore",
        href: ROUTES.SERVICES,
      },
      {
        id: "electrical",
        name: "Electrical",
        category: "Safety & Wiring",
        description:
          "Find support for everyday electrical installation, maintenance, and repair needs.",
        image: "/images/electrical.jpg",
        icon: "⚡",
        ctaText: "Explore",
        href: ROUTES.SERVICES,
      },
      {
        id: "appliance-repair",
        name: "Appliance Services",
        category: "Appliance Care",
        description:
          "Convenient access to services for common household appliances.",
        image: "/images/appliance-repair.jpg",
        icon: "🛠️",
        ctaText: "Explore",
        href: ROUTES.SERVICES,
      },
    ],
  },

  /* 4. OUR MISSION */
  mission: {
    eyebrow: "Our Purpose",
    heading: "Our Mission",
    statement:
      "To make everyday home services easier to discover, request, and manage while creating a structured digital platform for service professionals.",
    supportingText:
      "We are building a platform rooted in simplicity, accessibility, and transparency. By removing friction from service discovery and fostering respectful relationships with skilled professionals, our goal is to deliver better digital experiences for every home.",
    pillars: [
      {
        title: "Simplicity & Accessibility",
        description:
          "Designing straightforward digital interfaces that make arranging home care effortless on any device.",
        icon: "✨",
      },
      {
        title: "Transparency & Clear Scope",
        description:
          "Providing clear service scopes and published pricing details so expectations are aligned before work begins.",
        icon: "👁️",
      },
      {
        title: "Respect for Professionals",
        description:
          "Valuing the craftsmanship, time, and dedication of service professionals through organized workflows.",
        icon: "🤝",
      },
    ],
  },

  /* 5. OUR VISION */
  vision: {
    eyebrow: "Looking Forward",
    heading: "Our Vision",
    statement:
      "To build a home-services ecosystem where customers can access services with greater confidence and service professionals can connect with meaningful opportunities through technology.",
    aspirationalNote:
      "Our vision represents an ongoing aspiration. While our current platform enables direct booking and tracking, we are continuously evolving our tools to expand service accessibility and strengthen community connections.",
    commitments: [
      {
        title: "Confidence in Every Booking",
        description:
          "Creating a reliable ecosystem where homeowners can request essential services knowing that workflows, pricing, and expectations are clearly defined.",
      },
      {
        title: "Empowerment Through Technology",
        description:
          "Providing independent service professionals with intuitive tools to manage their bookings, communicate effectively, and build sustainable local livelihoods.",
      },
      {
        title: "Continuous Platform Evolution",
        description:
          "Iterating on our software architecture to make home care more accessible, dependable, and efficient for communities over time.",
      },
    ],
  },

  /* 6. TRUST & SAFETY */
  trust: {
    eyebrow: "Platform Safeguards",
    heading: "Trust & Safety",
    subtitle:
      "Platform principles and safeguards designed to create a secure, dependable experience.",
    subtleNote:
      "We continue to improve the systems and processes that support a safer and more dependable service experience.",
    practices: [
      {
        title: "Clear Service Information",
        description:
          "Every service page details inclusions, exclusions, and line items so expectations are clear from the outset.",
        tag: "Clarity",
        icon: "📋",
      },
      {
        title: "Transparent Communication",
        description:
          "Direct channels and timely status updates keep customers and service partners aligned throughout each booking.",
        tag: "Communication",
        icon: "💬",
      },
      {
        title: "Structured Interactions",
        description:
          "Standardized service milestones (Confirmed, Assigned, En Route, In Progress, Completed) ensure clear operational flow.",
        tag: "Workflow",
        icon: "🔄",
      },
      {
        title: "Responsible Data Handling",
        description:
          "User credentials and personal details are protected through encrypted storage, secure session tokens, and role-based permissions.",
        tag: "Privacy",
        icon: "🔒",
      },
      {
        title: "Slot Concurrency Controls",
        description:
          "Automated booking mechanisms lock appointment slots during scheduling to prevent double bookings and capacity conflicts.",
        tag: "Integrity",
        icon: "🛡️",
      },
      {
        title: "Resolution Pathways",
        description:
          "Dedicated inquiry and support workflows provide customers and partners with structured assistance when questions arise.",
        tag: "Support",
        icon: "🤝",
      },
    ],
    faqCta: {
      heading: "Have questions about how HomeCareX works?",
      description:
        "Find answers about services, bookings, payments, cancellations, and other common questions.",
      buttonLabel: "View FAQs",
      href: ROUTES.FAQ,
    },
  },

  /* 7. QUALITY */
  quality: {
    eyebrow: "Standards & Process",
    heading: "Our Approach to Quality",
    supportingMessage:
      "Quality starts with a clear experience—from discovering a service to completing the request.",
    description:
      "Rather than presenting quality as an abstract promise, HomeCareX treats quality as an ongoing operational discipline embedded across every stage of the platform.",
    steps: [
      {
        step: "01",
        title: "Clear Service Information",
        description:
          "Detailed service descriptions and defined scope items help ensure mutual understanding before any service begins.",
      },
      {
        step: "02",
        title: "Consistent Service Workflows",
        description:
          "Predictable milestone stages give both customers and service partners clear visibility into job progression.",
      },
      {
        step: "03",
        title: "Thoughtful User Experience",
        description:
          "Carefully designed, accessible interfaces reduce friction and make managing bookings simple across all devices.",
      },
      {
        step: "04",
        title: "Structured Partner Collaboration",
        description:
          "Clear dispatch notifications and organized job details support service partners in delivering their work smoothly.",
      },
      {
        step: "05",
        title: "Feedback & Continuous Improvement",
        description:
          "Customer reviews and post-service feedback loops inform ongoing platform enhancements and process refinements.",
      },
    ],
  },

  /* 8. OUR TEAM */
  team: {
    eyebrow: "Our Organization",
    heading: "The People Behind HomeCareX",
    subtitle:
      "The cross-functional teams focused on building and operating the platform.",
    intro:
      "HomeCareX brings together people focused on product, technology, service operations, and customer experience.",
    disciplines: [
      {
        id: "prod-tech",
        title: "Product & Technology",
        scope: "Platform Architecture & Engineering",
        description:
          "Responsible for designing and maintaining the booking architecture, capacity scheduling engine, secure user sessions, and accessible web interfaces.",
        focusAreas: [
          "Platform Architecture",
          "Capacity & Scheduling Engine",
          "Accessible Web Interfaces",
          "Data Security & Session Protection",
        ],
        icon: "💻",
      },
      {
        id: "service-ops",
        title: "Service Operations",
        scope: "Catalog & Workflow Coordination",
        description:
          "Focuses on defining standardized service scopes, establishing partner onboarding criteria, and coordinating service fulfillment across active categories.",
        focusAreas: [
          "Catalog Scope Standardization",
          "Partner Onboarding Guidelines",
          "Category Expansion",
          "Fulfillment Coordination",
        ],
        icon: "⚙️",
      },
      {
        id: "customer-exp",
        title: "Customer Experience",
        scope: "Support & User Advocacy",
        description:
          "Dedicated to assisting customers throughout their service journey, answering platform inquiries, and managing feedback to guide product improvements.",
        focusAreas: [
          "User Inquiry Support",
          "Booking Assistance",
          "Feedback Synthesis",
          "Resolution Pathways",
        ],
        icon: "🎧",
      },
      {
        id: "quality-safeguards",
        title: "Quality & Platform Safeguards",
        scope: "Process & System Integrity",
        description:
          "Monitors operational consistency, evaluates workflow reliability, and implements safety enhancements to maintain dependable service standards.",
        focusAreas: [
          "Workflow Auditing",
          "Platform Reliability",
          "Safety Protocols",
          "Continuous Enhancement",
        ],
        icon: "🛡️",
      },
    ],
  },

  /* 9. OUR VALUES */
  values: {
    eyebrow: "Guiding Principles",
    heading: "Our Values",
    subtitle:
      "The core principles guiding how we build our platform and serve our community.",
    items: [
      {
        number: "01",
        title: "Customer First",
        tagline: "Design experiences around real customer needs.",
        description:
          "We prioritize user clarity, convenience, and intuitive workflows to make arranging home maintenance straightforward and stress-free.",
        icon: "🎯",
      },
      {
        number: "02",
        title: "Transparency",
        tagline: "Make service information and interactions easier to understand.",
        description:
          "We believe in upfront scopes, clear pricing breakdowns, and open communication with no hidden fees or unexpected surprises.",
        icon: "🔍",
      },
      {
        number: "03",
        title: "Respect",
        tagline: "Value the time, skills, and effort of service professionals.",
        description:
          "We recognize service partners as essential professionals, providing organized digital tools and equitable workflows that respect their craftsmanship.",
        icon: "🤝",
      },
      {
        number: "04",
        title: "Responsibility",
        tagline: "Build and operate the platform thoughtfully.",
        description:
          "We safeguard user data, implement dependable scheduling controls, and maintain ethical practices across every platform interaction.",
        icon: "⚖️",
      },
      {
        number: "05",
        title: "Continuous Improvement",
        tagline: "Learn from feedback and improve the experience over time.",
        description:
          "We actively listen to customer and partner insights, using real feedback to refine our software, expand services, and elevate standards.",
        icon: "📈",
      },
    ],
  },

  /* 10. HOW HOMECAREX CONNECTS PEOPLE */
  howItWorks: {
    eyebrow: "How It Works",
    heading: "How HomeCareX Connects People",
    subtitle:
      "A simple 3-step digital journey from service discovery to fulfilled care.",
    steps: [
      {
        number: "01",
        title: "Discover",
        summary: "Customers explore available home services.",
        description:
          "Browse catalogued services across essential home categories, review detailed scopes of work, and inspect itemized upfront pricing.",
        details: [
          "Browse residential service categories",
          "Inspect transparent rate cards & inclusions",
          "Select optional add-on requirements",
        ],
        icon: "🔍",
      },
      {
        number: "02",
        title: "Request",
        summary: "Customers select and request the service they need through the platform.",
        description:
          "Choose a convenient appointment slot, provide necessary service address details, and submit a structured booking request.",
        details: [
          "Choose preferred date & time slot",
          "Provide task details and location",
          "Secure reservation with automated slot locking",
        ],
        icon: "📝",
      },
      {
        number: "03",
        title: "Connect",
        summary: "The platform facilitates the interaction between customers and service partners.",
        description:
          "The platform coordinates with service partners to confirm scheduling and tracks milestone progress from arrival to completion.",
        details: [
          "Platform coordinates partner assignment",
          "Track real-time status transitions",
          "Provide post-service feedback and review",
        ],
        icon: "🤝",
      },
    ],
  },

  /* 11. FINAL CTA */
  cta: {
    heading: "Your Home. Your Time. Simplified.",
    description:
      "Explore the services available through HomeCareX and find a simpler way to manage your everyday home-service needs.",
    primaryCta: {
      label: "Explore Services",
      href: ROUTES.SERVICES,
    },
    secondaryCta: {
      label: "Become a Partner",
      href: `${ROUTES.CONTACT}#partner-interest`,
    },
  },
};
