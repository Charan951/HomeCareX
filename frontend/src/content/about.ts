import { ROUTES } from "../constants/routes";

/* =========================================================================
   TYPES: HOMECAREX ABOUT PAGE CONTENT
   Strictly adheres to verified platform capabilities with zero unsupported claims.
   ========================================================================= */

export interface AboutHeroHighlight {
  icon: string;
  title: string;
  subtitle?: string;
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
  description?: string;
  icon?: string;
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
  description?: string;
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
  description?: string;
  icon?: string;
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
  description?: string;
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
  description?: string;
  icon?: string;
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
  description?: string;
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
  description?: string;
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
  description?: string;
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
      },
      {
        icon: "📅",
        title: "Structured Booking",
      },
      {
        icon: "🔄",
        title: "Tracked Workflows",
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
    challengesTitle: "Key Challenges We Address",
    challenges: [
      {
        icon: "🔍",
        title: "Uncertain Rates & Fragmented Discovery",
      },
      {
        icon: "⏱️",
        title: "Manual Booking & Timing Conflicts",
      },
      {
        icon: "📱",
        title: "Disorganized Service Workflows",
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
        icon: "✨",
      },
      {
        title: "Transparency & Clear Scope",
        icon: "👁️",
      },
      {
        title: "Respect for Professionals",
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
        icon: "🎯",
      },
      {
        title: "Empowerment Through Technology",
        icon: "💻",
      },
      {
        title: "Continuous Platform Evolution",
        icon: "🔄",
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
        tag: "Clarity",
        icon: "📋",
      },
      {
        title: "Transparent Communication",
        tag: "Communication",
        icon: "💬",
      },
      {
        title: "Structured Interactions",
        tag: "Workflow",
        icon: "🔄",
      },
      {
        title: "Responsible Data Handling",
        tag: "Privacy",
        icon: "🔒",
      },
      {
        title: "Slot Concurrency Controls",
        tag: "Integrity",
        icon: "🛡️",
      },
      {
        title: "Resolution Pathways",
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
        icon: "📋",
      },
      {
        step: "02",
        title: "Consistent Service Workflows",
        icon: "🔄",
      },
      {
        step: "03",
        title: "Thoughtful User Experience",
        icon: "📱",
      },
      {
        step: "04",
        title: "Structured Partner Collaboration",
        icon: "🤝",
      },
      {
        step: "05",
        title: "Feedback & Continuous Improvement",
        icon: "📈",
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
        icon: "🎯",
      },
      {
        number: "02",
        title: "Transparency",
        tagline: "Make service information and interactions easier to understand.",
        icon: "🔍",
      },
      {
        number: "03",
        title: "Respect",
        tagline: "Value the time, skills, and effort of service professionals.",
        icon: "🤝",
      },
      {
        number: "04",
        title: "Responsibility",
        tagline: "Build and operate the platform thoughtfully.",
        icon: "⚖️",
      },
      {
        number: "05",
        title: "Continuous Improvement",
        tagline: "Learn from feedback and improve the experience over time.",
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
