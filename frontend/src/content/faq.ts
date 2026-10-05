export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQGroup {
  id: string;
  title: string;
  questions: FAQItem[];
}

export interface FAQHeroContent {
  eyebrow: string;
  heading: string;
  description: string;
}

export interface FAQPageContent {
  hero: FAQHeroContent;
  groups: FAQGroup[];
  contactCta: {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  };
}

export const faqData: FAQPageContent = {
  hero: {
    eyebrow: "Help & Support Center",
    heading: "How can we help you?",
    description:
      "Find immediate answers to frequently asked questions about booking, payments, services, cancellations, and your account.",
  },
  groups: [
    {
      id: "booking",
      title: "Booking",
      questions: [
        {
          id: "booking-how-to",
          question: "How do I book a service on HomeCareX?",
          answer:
            "Navigate to the Services catalog, choose the specific service category you need, select any relevant service add-ons, pick a preferred date and 2-hour time slot, enter your service address, and confirm your booking request.",
        },
        {
          id: "booking-window",
          question: "How far in advance can I schedule a booking?",
          answer:
            "HomeCareX allows you to book services for today and up to 13 days in advance (a 14-day total booking window), letting you plan routine maintenance or immediate repairs with certainty.",
        },
        {
          id: "booking-slots",
          question: "What time slots are available for appointments?",
          answer:
            "Services are scheduled in standard 2-hour daily slots: 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, 16:00–18:00, and 18:00–20:00 (Asia/Kolkata). Available capacity is checked in real time during checkout.",
        },
        {
          id: "booking-add-ons",
          question: "Can I add extra tasks or special requirements to my booking?",
          answer:
            "Yes. When selecting a service, you can choose optional add-on services (such as specialized sanitization, filter replacements, or additional materials) which are clearly itemized in your price breakdown.",
        },
        {
          id: "booking-status-tracking",
          question: "How can I track the progress of my booking?",
          answer:
            "Once submitted, you can monitor your booking in your customer dashboard through each distinct status: Confirmed, Searching for Partner, Assigned, En Route, Arrived, In Progress, and Completed.",
        },
      ],
    },
    {
      id: "services",
      title: "Services",
      questions: [
        {
          id: "services-what-offered",
          question: "What services does HomeCareX provide?",
          answer:
            "HomeCareX provides essential home services including Home Cleaning, Plumbing, Electrical, Painting, Appliance Repair, and Routine Home Maintenance.",
        },
        {
          id: "services-pricing-model",
          question: "Are service prices fixed or estimated?",
          answer:
            "HomeCareX features transparent pricing. Each service has a published base price and clearly quantified add-on rates displayed upfront, avoiding unexpected surprises when the job is done.",
        },
        {
          id: "services-partner-matching",
          question: "Who will perform my requested service?",
          answer:
            "Our matching system assigns an available registered service professional who specializes in your requested service category and is located within your service area.",
        },
        {
          id: "services-materials",
          question: "Are spare parts and materials included in the service cost?",
          answer:
            "Standard consumable tools are typically provided by the service professional. Specialized replacement parts or add-on materials are itemized as separate add-on options or discussed upfront before work proceeds.",
        },
      ],
    },
    {
      id: "payments",
      title: "Payments",
      questions: [
        {
          id: "payments-currency-methods",
          question: "What currency and payment options are supported?",
          answer:
            "All transactions are processed in Indian Rupees (INR). You can complete payment securely during checkout using supported payment methods for your booking.",
        },
        {
          id: "payments-convenience-fee",
          question: "Is there a platform convenience fee?",
          answer:
            "A standard platform convenience fee of ₹29 is applied per booking order. This fee supports platform operations, slot concurrency locking, and customer support coordination.",
        },
        {
          id: "payments-coupons",
          question: "Can I apply promotional discount coupons?",
          answer:
            "Yes, if you have a valid promotional coupon code, you can enter it in the checkout price summary before finalizing payment to apply eligible discounts.",
        },
        {
          id: "payments-receipts",
          question: "Where can I view my invoice or receipt?",
          answer:
            "Every completed or active booking displays a full itemized price snapshot in your account dashboard, detailing base price, add-ons, convenience fee, discounts, and total paid.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation",
      questions: [
        {
          id: "cancellation-policy",
          question: "Can I cancel my scheduled booking?",
          answer:
            "Yes, customers can cancel a booking directly from their account dashboard prior to service execution. You will be prompted to provide an optional cancellation reason for our records.",
        },
        {
          id: "cancellation-partner-cancelled",
          question: "What happens if an assigned partner cancels?",
          answer:
            "If an assigned partner becomes unavailable, the system automatically transitions your booking back to 'Searching for Partner' to re-assign an alternate qualified professional or allow you to reschedule.",
        },
        {
          id: "cancellation-process",
          question: "How do I initiate a cancellation?",
          answer:
            "Open your Bookings list in the customer portal, select the active booking, click the 'Cancel Booking' option, and confirm your request.",
        },
      ],
    },
    {
      id: "refunds",
      title: "Refunds",
      questions: [
        {
          id: "refunds-eligibility",
          question: "Am I eligible for a refund when I cancel?",
          answer:
            "If a booking with payment completed is cancelled before work commences, the payment record is transitioned to 'REFUNDED' in accordance with platform cancellation terms.",
        },
        {
          id: "refunds-timeline",
          question: "How long does it take for a refund to reflect in my account?",
          answer:
            "Refunds are routed back to the original source payment method. Standard banking and gateway timelines typically take 5 to 7 business days to reflect in your bank account or card statement.",
        },
        {
          id: "refunds-disputes",
          question: "What if there is a discrepancy with service quality or billing?",
          answer:
            "If you experience an issue with service delivery or billing accuracy, you can flag a dispute or contact our support team via the Contact page. Our operations team reviews the audit log and resolves the matter.",
        },
      ],
    },
    {
      id: "account",
      title: "Account",
      questions: [
        {
          id: "account-requirement",
          question: "Do I need to register an account to make a booking?",
          answer:
            "Yes, creating an account ensures you can monitor live booking statuses, manage your saved addresses, view history, and leave reviews for completed services.",
        },
        {
          id: "account-multiple-addresses",
          question: "Can I save more than one service address?",
          answer:
            "Yes, your account profile allows you to store multiple delivery addresses with custom labels (such as Home or Office), landmarks, and contact phone numbers.",
        },
        {
          id: "account-partner-signup",
          question: "How do I sign up as a service partner?",
          answer:
            "Experienced service professionals can visit the Contact page and submit the Partner Interest form with their details and service categories. Our partner team will follow up directly.",
        },
        {
          id: "account-security",
          question: "How is my account data secured?",
          answer:
            "HomeCareX uses secure password hashing, protected sessions, and role-based permissions to ensure customer and partner records remain strictly protected.",
        },
      ],
    },
  ],
  contactCta: {
    title: "Still have questions?",
    description: "Can't find the answer you're looking for? Reach out to our dedicated support team.",
    actionLabel: "Contact Support",
    actionHref: "/contact",
  },
};
