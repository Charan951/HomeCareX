export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

export interface LegalDocumentContent {
  title: string;
  description: string;
  lastUpdated: string;
  pendingApprovalNotice: string;
  sections: LegalSection[];
}

export const termsContent: LegalDocumentContent = {
  title: "Terms & Conditions",
  description:
    "These Terms & Conditions govern your access to and use of the HomeCareX digital platform, website, and home-services marketplace.",
  lastUpdated: "October 1, 2026",
  pendingApprovalNotice: "Legal copy pending approval — not production-approved.",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      content: [
        "Welcome to HomeCareX. These Terms and Conditions (\"Terms\") govern your access to and use of the HomeCareX website, mobile applications, technology platform, and related on-demand home-services marketplace (collectively, the \"Platform\").",
        "• Marketplace Role: HomeCareX operates as a digital technology platform that facilitates connections between individuals seeking everyday residential maintenance and household care services (\"Customers\") and independent third-party service professionals (\"Service Partners\").",
        "• Agreement to Terms: By accessing, registering for, or using the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree with any part of these Terms, you must discontinue your use of the Platform immediately.",
        "• Policy Modifications: HomeCareX reserves the right to modify or amend these Terms at any time. Any changes will be posted on this page with an updated \"Last updated\" date. Continued use of the Platform following any modifications constitutes your acceptance of the revised Terms.",
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      content: [
        "• Age Requirement: To access and use the HomeCareX Platform, you must be at least 18 years of age and possess the legal capacity to enter into a legally binding contract under applicable laws.",
        "• Truthful Representation: By registering for an account or booking a service, you represent and warrant that all registration details submitted are truthful and accurate, and that your use of the Platform does not violate any applicable law or regulation.",
        "• Account Suspension: HomeCareX reserves the right to suspend or terminate access to any account where eligibility criteria are not met or where fraudulent information has been provided.",
      ],
    },
    {
      id: "account",
      title: "3. Account Registration & Responsibilities",
      content: [
        "• Registration Details: In order to access core booking features on HomeCareX, you may be required to register and maintain an active personal user account. You agree to provide accurate, current, and complete information during the registration process and to keep such details updated.",
        "• Credential Security: You are solely responsible for maintaining the confidentiality of your account credentials, including your password and access tokens. You agree to accept responsibility for all activities and booking requests that occur under your account.",
        "• Security Breach Notification: You must notify HomeCareX immediately at support@homecarex.com upon becoming aware of any unauthorized use of your account or any other known breach of security.",
        "• Non-Transferability: You may not authorize third parties to use your account, nor may you assign or transfer your account to any other person or entity without prior written authorization from HomeCareX.",
      ],
    },
    {
      id: "services",
      title: "4. HomeCareX Services",
      content: [
        "• Curated Marketplace: HomeCareX provides a curated digital marketplace that enables Customers to discover, schedule, and coordinate various residential care and maintenance services, including cleaning, plumbing, electrical, appliance servicing, painting, and general home upkeep.",
        "• Intermediary Role: You acknowledge and agree that HomeCareX acts solely as a digital technology intermediary. Unless explicitly stated in writing for a specific service category, HomeCareX does not directly perform the home services, nor does HomeCareX employ Service Partners as direct employees.",
        "• Independent Contractors: Service Partners operate as independent professionals and contractors. HomeCareX is not responsible for the direct execution, physical craftsmanship, or on-site methods employed by Service Partners, beyond providing the digital coordination, slot capacity tools, and operational communication channels.",
      ],
    },
    {
      id: "booking",
      title: "5. Booking & Service Requests",
      content: [
        "• Service Requests: Customers may request services by selecting a catalogued service category, reviewing line items and optional add-ons, specifying the service address, and choosing an available appointment arrival window.",
        "• Automated Slot Locking: When a booking is placed, HomeCareX uses automated capacity locking mechanisms to reserve the selected time slot and coordinate with available Service Partners. Submission of a request constitutes an offer to book the specified service.",
        "• Confirmation Milestones: A service booking is considered confirmed once HomeCareX issues a digital booking confirmation notification via the Platform. Service status milestones (such as Confirmed, Assigned, En Route, In Progress, and Completed) are recorded in the booking timeline.",
        "• Rescheduling Policy: Customers may request rescheduling through the Platform subject to slot availability and the rescheduling terms outlined in our cancellation policy.",
      ],
    },
    {
      id: "pricing",
      title: "6. Pricing & Estimates",
      content: [
        "• Published Rates: Pricing displayed on the Platform reflects published base rates and estimated fees for standard service scopes, plus applicable taxes and convenience or platform fees where indicated.",
        "• Scope Reassessment: Initial booking prices are estimates based on standard residential requirements and customer selections. If additional materials, specialized parts, or extended labor are required upon on-site assessment, the Service Partner will communicate the revised scope before commencing extra work.",
        "• Customer Approval: Any additional scope must be agreed upon by the Customer and registered through the Platform or authorized digital job card before work on the additional scope begins.",
        "• Catalog Updates: HomeCareX reserves the right to adjust catalog pricing, promotional offers, and convenience fees from time to time. Any changes in pricing will not affect bookings that have already been confirmed.",
      ],
    },
    {
      id: "payments",
      title: "7. Payments",
      content: [
        "• Payment Channels: Payments for services requested through HomeCareX may be made through authorized electronic payment methods (including credit/debit cards, UPI, net banking, and digital wallets) processed by compliant third-party payment gateways, or via cash-on-service where supported.",
        "• Payment Authorization: By providing payment details, you authorize HomeCareX and its payment partners to charge the total confirmed amount for the service, including base fees, approved add-ons, and applicable statutory taxes.",
        "• Invoices & Receipts: Digital invoices and payment receipts are generated automatically upon successful payment and made available within your account order history.",
        "• Payment Failures: In the event of a payment failure, chargeback, or unpaid balance, HomeCareX reserves the right to suspend booking privileges until all outstanding balances are settled.",
      ],
    },
    {
      id: "cancellation",
      title: "8. Cancellation",
      content: [
        "• Customer Cancellation: Customers may cancel a scheduled service booking directly through the Platform prior to the arrival of the Service Partner.",
        "• Free Cancellation Window: Cancellations made within a reasonable advance window (as displayed during checkout) will incur no cancellation charge, and any pre-paid amounts will be credited back in accordance with our refund policy.",
        "• Late Cancellation Fee: If a cancellation is requested after a Service Partner has been dispatched or has arrived at the service address, a nominal cancellation fee may be applied to compensate the professional for travel and allocated scheduling time.",
        "• Unforeseen Cancellations: Service Partners or HomeCareX may cancel a booking in unforeseen circumstances, such as severe weather, safety concerns at the premises, or emergency unavailability. In such events, HomeCareX will assist in rescheduling the service or issue a full refund for any pre-paid fees.",
      ],
    },
    {
      id: "refund-policy",
      title: "9. Refund Policy",
      content: [
        "• Policy Commitment: HomeCareX is committed to maintaining fair and transparent billing practices. This Refund Policy governs the eligibility, review procedures, and payment reversals associated with bookings made on the Platform.",
        "• Eligible Cancellations & Windows: Where a Customer cancels a scheduled service request before partner dispatch or within the permissible advance cancellation window communicated during booking, any pre-paid service fees will be refunded in full.",
        "• Cancellation After Dispatch or Arrival: If a Customer cancels a booking after a Service Partner has been dispatched or has arrived at the designated premises, a nominal cancellation or dispatch fee may be deducted from the refund amount to compensate the partner for travel and reserved scheduling time.",
        "• Service Not Delivered: If a confirmed booking is not fulfilled because a Service Partner fails to attend or cannot complete dispatch due to operational unavailability, the Customer is entitled to a full refund of any pre-paid amounts or the option to reschedule without penalty.",
        "• Partially Completed Services: If a service is interrupted or partially completed due to unforeseen technical complications, scope reassessment, or platform-related issues, the payable charges will be adjusted proportionately, and a partial refund will be issued for unperformed work upon joint review with the Customer.",
        "• Duplicate Payments & Transaction Errors: In the event of duplicate billing, network timeouts, or verified payment gateway processing discrepancies, excess amounts charged will be refunded automatically upon reconciliation.",
        "• Failed or Deficient Service Delivery: If a Customer experiences unsatisfactory service or failure to meet the agreed-upon catalog scope, the Customer may submit a service inquiry through our support desk. HomeCareX investigates such inquiries in good faith with the Customer and Service Partner.",
        "• Refund Processing & Payment Method: Approved refunds and payment reversals are credited directly back to the original source payment method (e.g. credit/debit card, UPI account, or digital wallet) used during checkout. Standard banking clearing processes apply once the platform initiates the reversal.",
        "• Non-Refundable Items & Exclusions: Refunds do not apply to: (a) consumable spare parts, hardware, or replacement materials purchased directly by or on behalf of the Customer during authorized on-site work; (b) completed services where the full scope was signed off or acknowledged; or (c) bookings canceled due to safety violations, abusive conduct, or failure to provide access to the premises.",
        "• Disputes & Support Escalations: Any questions, claims, or disputes regarding refund assessments should be directed to our customer support team at support@homecarex.com or through the Help Center. Our team aims to review and respond to all billing inquiries in a timely and equitable manner.",
      ],
    },
    {
      id: "customer-responsibilities",
      title: "10. Customer Responsibilities",
      content: [
        "• Premises Access: Customers agree to provide accurate, safe, and unobstructed access to the service premises at the scheduled appointment time.",
        "• Essential Utilities: Customers must ensure that basic utilities (such as running water and electricity) necessary for performing the service are accessible.",
        "• Valuables Security: Customers are responsible for securing all personal valuables, jewelry, cash, and sensitive documents prior to the arrival of the Service Partner.",
        "• Respectful Conduct: Customers must maintain a safe and respectful environment for Service Partners. Verbal abuse, harassment, discrimination, or physical threats toward any Service Partner will result in immediate termination of the booking and permanent suspension from the Platform.",
      ],
    },
    {
      id: "partner-responsibilities",
      title: "11. Partner Responsibilities",
      content: [
        "• Professional Standards: Service Partners agree to maintain high professional standards, punctuality, and courteous conduct when fulfilling bookings scheduled through HomeCareX.",
        "• Skills & Equipment: Service Partners must possess the technical skills, training, and standard equipment required to safely execute the service categories they accept.",
        "• Status Timestamps: Service Partners are required to update booking status timestamps accurately (e.g., En Route, Arrived, In Progress, Completed) via the partner application to maintain platform operational transparency.",
        "• No Off-Platform Solicitation: Service Partners are independent contractors and are strictly prohibited from soliciting private off-platform work from Customers introduced through HomeCareX.",
      ],
    },
    {
      id: "platform-responsibilities",
      title: "12. HomeCareX Platform Responsibilities",
      content: [
        "• Marketplace Operations: HomeCareX is responsible for operating, maintaining, and improving the digital marketplace infrastructure that connects Customers and Service Partners.",
        "• Capacity Controls: The Platform implements automated capacity management and slot locking to minimize double-bookings and scheduling conflicts.",
        "• Support & Mediation: HomeCareX provides communication channels, digital status notifications, and customer care workflows to address operational inquiries and facilitate dispute resolution.",
        "• Data Safeguards: HomeCareX treats user data responsibly and implements industry-standard administrative and technological safeguards as detailed in our Privacy Policy.",
      ],
    },
    {
      id: "liability",
      title: "13. Liability & Limitations",
      content: [
        "• \"As Is\" Availability: To the maximum extent permitted by applicable law, HomeCareX provides the Platform on an \"as is\" and \"as available\" basis without express or implied warranties of any kind.",
        "• System Stability: HomeCareX does not warrant that the Platform will be uninterrupted, error-free, or free of harmful components, though we maintain continuous efforts to optimize system stability.",
        "• Limitation of Damages: In no event shall HomeCareX, its directors, employees, or affiliates be liable for indirect, incidental, punitive, or consequential damages arising out of or related to your use of the Platform or third-party service fulfillment.",
        "• Aggregate Liability Cap: Where statutory consumer protection provisions cannot be excluded by law, HomeCareX's aggregate liability for direct claims arising from a booking shall be limited to the total service fee paid by the Customer for that specific booking.",
      ],
    },
    {
      id: "disputes",
      title: "14. Disputes & Governing Terms",
      content: [
        "• Informal Resolution First: If any dispute, controversy, or claim arises between you and HomeCareX regarding the Platform or these Terms, the parties agree to first attempt informal resolution by contacting our customer care team at support@homecarex.com.",
        "• 30-Day Window: If a dispute cannot be resolved informally within thirty (30) days of written notification, it shall be resolved in accordance with applicable laws.",
        "• Governing Law & Jurisdiction: These Terms shall be governed by, interpreted, and construed in accordance with the laws of India, without regard to conflict of law principles. Any legal proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.",
      ],
    },
    {
      id: "contact",
      title: "15. Contact Us",
      content: [
        "If you have any questions, feedback, or legal inquiries regarding these Terms & Conditions or the HomeCareX Platform, please reach out to us through any of the following channels:",
        "• Email Support: support@homecarex.com",
        "• Phone Helpline: +91 93902 12572",
        "• Support Portal: Visit our Help Center or Contact Us page at /contact",
        "• Legal Notices: Written legal communications should be directed to HomeCareX Legal & Compliance at support@homecarex.com.",
      ],
    },
  ],
};
