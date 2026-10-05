import type { LegalDocumentContent } from "./terms";

export const privacyContent: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "This Privacy Policy explains how HomeCareX collects, uses, shares, protects, and retains your personal information when you use our platform and home-services marketplace.",
  lastUpdated: "October 1, 2026",
  pendingApprovalNotice: "Legal copy pending approval — not production-approved.",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      content: [
        "HomeCareX (\"we\", \"our\", or \"us\") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy describes how we collect, use, disclose, and safeguard your data when you visit our website, utilize our mobile applications, or engage with our on-demand home-services platform.",
        "• Policy Consent: By accessing our platform or requesting home services, you acknowledge that you have read and understood this Privacy Policy and consent to the data practices described herein.",
        "• Periodic Updates: We may update this policy periodically to reflect evolving platform capabilities, legal standards, or operational practices. We encourage you to review this page periodically to stay informed about how we safeguard your personal information.",
      ],
    },
    {
      id: "information-collected",
      title: "2. Information We Collect",
      content: [
        "We collect information necessary to provide, coordinate, and improve home services on our digital platform. Depending on how you interact with HomeCareX, we collect information in three primary ways:",
        "• Direct Submissions: Information you provide directly to us (such as during account creation, service scheduling, or customer support inquiries).",
        "• Automated Tracking: Information collected automatically when you browse or navigate our digital platform (such as device metrics, IP address, and cookie identifiers).",
        "• Platform Interactions: Information received through platform interactions (such as service completion confirmations and customer feedback reviews).",
      ],
    },
    {
      id: "personal-information",
      title: "3. Personal Information",
      content: [
        "When you register an account, request a service booking, or register interest as a service partner, we may collect personally identifiable information, including:",
        "• Contact Details: Full name, email address, and mobile phone number.",
        "• Service Address Details: Residential address, apartment/unit number, landmark, and postal code required for dispatching service professionals.",
        "• Account Credentials: Username, encrypted authentication passwords, and role permissions.",
        "• Communication Records: Customer support inquiries, message transcripts, and feedback ratings submitted through the platform.",
      ],
    },
    {
      id: "location-data",
      title: "4. Location Information",
      content: [
        "Accurate location data is essential for our on-demand home-services marketplace to operate effectively.",
        "With your permission, we collect precise or approximate location information through your device (GPS, Wi-Fi network data, and IP address) to:",
        "• Service Availability Verification: Verify whether services are currently active in your neighborhood or city.",
        "• Nearby Partner Assignment: Connect your service request with nearby available Service Partners.",
        "• Navigation Support: Enable Service Partners to navigate accurately to your designated service address.",
        "• Real-Time Tracking: Provide real-time status updates (such as 'En Route' and arrival notifications) during active bookings.",
        "• User Location Controls: You may control location tracking through your mobile device or browser settings, though disabling location permissions may affect service discovery and booking accuracy.",
      ],
    },
    {
      id: "payment-information",
      title: "5. Payment Information",
      content: [
        "• Gateway Processing: When you make a payment for a booking through the Platform, financial transaction processing is handled securely by compliant third-party payment gateway providers.",
        "• No Raw Card Storage: HomeCareX does not store raw credit card numbers, debit card PINs, or CVV codes on our servers. Payment processors provide HomeCareX with transaction tokens, authorization confirmation numbers, and invoice summary details necessary for accounting and receipt generation.",
        "• TLS Encryption: All payment data transmitted through our web interfaces is encrypted using industry-standard Transport Layer Security (TLS) protocols.",
      ],
    },
    {
      id: "usage-data",
      title: "6. Usage & Device Information",
      content: [
        "When you access the HomeCareX Platform, our servers automatically record certain technical and usage details, including:",
        "• Device Identifiers: Hardware model, operating system version, and unique browser signatures.",
        "• Network Metrics: Internet Protocol (IP) address, approximate geographic region, and Internet service provider.",
        "• Platform Activity: Pages viewed, services browsed, search queries entered, referral URLs, timestamps, and error logs.",
        "• Diagnostic Objective: This data helps our engineering team diagnose platform issues, maintain server performance, and enhance accessibility across various screen sizes and devices.",
      ],
    },
    {
      id: "information-sharing",
      title: "7. How We Share Information",
      content: [
        "HomeCareX does not sell, rent, or trade your personal information to third parties for independent marketing purposes. We share information only in limited, legitimate circumstances essential to operating our marketplace:",
        "• Matched Service Partners: When you confirm a booking, we share your service address, contact name, phone number, and job scope details with the matched Service Partner solely to facilitate service delivery.",
        "• Technology Service Providers: We engage trusted technology vendors for cloud database hosting, SMS and email notification delivery, map APIs, and analytics support under strict confidentiality agreements.",
        "• Legal & Safety Compliance: We may disclose information if required by applicable law, court order, or governmental regulation, or when necessary to protect the safety, property, and legal rights of HomeCareX, our users, or the public.",
      ],
    },
    {
      id: "cookies",
      title: "8. Cookies & Similar Technologies",
      content: [
        "HomeCareX uses cookies, web beacons, and local storage tokens to recognize your browser, maintain active login sessions, remember user preferences, and understand platform usage patterns.",
        "• Essential Cookies: Necessary for core platform operation, secure account authentication, and booking slot concurrency.",
        "• Functional Cookies: Remember your site preferences, such as selected city or display options.",
        "• Analytics Cookies: Help us measure platform performance, traffic volume, and page interaction metrics to improve user experience.",
        "• Browser Settings: You can configure your browser to reject cookies or alert you when cookies are being sent. Note that disabling essential cookies may impact platform functionality and access to authenticated features.",
      ],
    },
    {
      id: "security",
      title: "9. Data Security",
      content: [
        "• Administrative & Technical Safeguards: HomeCareX employs administrative, organizational, and technical safeguards designed to protect personal information against unauthorized access, loss, misuse, or alteration.",
        "• Protective Measures: These measures include encrypted communication channels (TLS/HTTPS), salted password hashing, role-based access restrictions, firewall protections, and regular system vulnerability audits.",
        "• User Vigilance: While we strive to use commercially acceptable means to safeguard your personal data, no method of transmission over the Internet or electronic storage is completely impenetrable. We encourage you to use unique passwords and safeguard your account credentials.",
      ],
    },
    {
      id: "retention",
      title: "10. Data Retention",
      content: [
        "• Operational Retention: We retain personal information for as long as your account remains active or as necessary to fulfill booking orders, provide customer support, and maintain platform integrity.",
        "• Legal & Tax Compliance: We may also retain certain information to comply with statutory legal, tax, accounting, and reporting obligations, resolve disputes, and enforce our agreements.",
        "• Secure Deletion & Anonymization: When personal data is no longer required for operational or legal purposes, it is securely deleted, anonymized, or isolated from active processing in accordance with our data retention guidelines.",
      ],
    },
    {
      id: "user-rights",
      title: "11. User Rights & Third Parties",
      content: [
        "Subject to applicable privacy and data protection laws, you may exercise certain rights regarding your personal information:",
        "• Access & Review: You have the right to request access to the personal data we hold about you.",
        "• Profile Correction: You can update or correct your profile details, contact information, and saved addresses directly within your account settings.",
        "• Account Deletion: You may submit a request to deactivate your account and delete your associated personal data, subject to legal and financial retention requirements.",
        "• External Third-Party Links: Our Platform may contain links to external third-party services (such as map providers or social media platforms). We are not responsible for the privacy practices or content of third-party websites.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact Us",
      content: [
        "If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Privacy & Grievance team through the following channels:",
        "• Email Support: privacy@homecarex.com or support@homecarex.com",
        "• Phone Helpline: +91 93902 12572",
        "• Headquarters Location: Hyderabad, Telangana, India",
        "• Response Commitment: We aim to acknowledge and address all privacy inquiries in a timely and responsible manner.",
      ],
    },
  ],
};
