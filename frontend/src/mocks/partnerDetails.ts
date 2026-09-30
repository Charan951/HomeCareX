export type KycStatus =
  | "Approved"
  | "Pending"
  | "Rejected";

export type AccountStatus =
  | "Active"
  | "Inactive"
  | "Suspended";

export type KycDocumentStatus =
  | "Verified"
  | "Pending"
  | "Rejected";

export interface PartnerDocument {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
  status: KycDocumentStatus;
}

export interface KycItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export interface PartnerBooking {
  id: string;
  customer: string;
  service: string;
  date: string;
  status: string;
  amount: number;
}

export interface PartnerReview {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PartnerActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface PartnerEarning {
  month: string;
  bookings: number;
  earnings: number;
}

export interface PartnerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;

  kycStatus: KycStatus;
  accountStatus: AccountStatus;

  category: string;
  categories: string[];

  city: string;
  address: string;

  rating: number;
  acceptance: number;
  completion: number;

  joined: string;

  profile: {
    experience: number;
    bio: string;
  };

  kyc: {
    submittedAt: string;
    reviewedAt?: string;
    documents: PartnerDocument[];
    checklist: KycItem[];
  };

  performance: {
    completedBookings: number;
    cancelledBookings: number;
    averageResponseTime: string;
    customerSatisfaction: number;
  };

  bookings: PartnerBooking[];

  earnings: PartnerEarning[];

  payouts: {
    id: string;
    date: string;
    amount: number;
    status: string;
  }[];

  reviews: PartnerReview[];

  support: {
    ticketId: string;
    subject: string;
    status: string;
    createdAt: string;
  }[];

  activity: PartnerActivity[];
}

export const PARTNER_DETAILS: PartnerDetails[] = [
  // ============================================================
  // PAR001
  // ============================================================
  {
    id: "PAR001",
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    phone: "+91 98765 43210",

    kycStatus: "Approved",
    accountStatus: "Active",

    category: "Home Cleaning",
    categories: [
      "Home Cleaning",
      "Deep Cleaning",
      "Kitchen Cleaning",
    ],

    city: "Hyderabad",
    address: "Madhapur, Hyderabad",

    rating: 4.8,
    acceptance: 95,
    completion: 97,

    joined: "2025-06-15",

    profile: {
      experience: 6,
      bio: "Experienced home service professional specialising in residential cleaning and maintenance.",
    },

    kyc: {
      submittedAt: "2026-09-28",
      reviewedAt: "2026-09-29",

      documents: [
        {
          id: "DOC001",
          name: "Aadhaar Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=Aadhaar+Document",
          status: "Verified",
        },
        {
          id: "DOC002",
          name: "PAN Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=PAN+Document",
          status: "Verified",
        },
        {
          id: "DOC003",
          name: "Address Proof",
          type: "pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          status: "Verified",
        },
      ],

      checklist: [
        {
          id: "identity",
          label: "Identity document verified",
          completed: true,
          required: true,
        },
        {
          id: "pan",
          label: "PAN document verified",
          completed: true,
          required: true,
        },
        {
          id: "address",
          label: "Address proof verified",
          completed: true,
          required: true,
        },
        {
          id: "bank",
          label: "Bank account verified",
          completed: true,
          required: true,
        },
        {
          id: "photo",
          label: "Profile photo verified",
          completed: true,
          required: true,
        },
      ],
    },

    performance: {
      completedBookings: 248,
      cancelledBookings: 6,
      averageResponseTime: "8 minutes",
      customerSatisfaction: 96,
    },

    bookings: [
      {
        id: "BK001",
        customer: "Anita Rao",
        service: "Home Cleaning",
        date: "2026-09-28",
        status: "Completed",
        amount: 850,
      },
      {
        id: "BK002",
        customer: "Rahul Mehta",
        service: "Deep Cleaning",
        date: "2026-09-26",
        status: "Completed",
        amount: 1400,
      },
      {
        id: "BK003",
        customer: "Sneha Patel",
        service: "Kitchen Cleaning",
        date: "2026-09-25",
        status: "Upcoming",
        amount: 950,
      },
    ],

    earnings: [
      {
        month: "July 2026",
        bookings: 42,
        earnings: 38200,
      },
      {
        month: "August 2026",
        bookings: 47,
        earnings: 42800,
      },
      {
        month: "September 2026",
        bookings: 39,
        earnings: 36100,
      },
    ],

    payouts: [
      {
        id: "PAY001",
        date: "2026-09-25",
        amount: 12500,
        status: "Paid",
      },
      {
        id: "PAY002",
        date: "2026-09-10",
        amount: 10800,
        status: "Paid",
      },
    ],

    reviews: [
      {
        id: "REV001",
        customer: "Anita Rao",
        rating: 5,
        comment: "Very professional and punctual.",
        date: "2026-09-28",
      },
      {
        id: "REV002",
        customer: "Rahul Mehta",
        rating: 5,
        comment: "Excellent cleaning service.",
        date: "2026-09-26",
      },
    ],

    support: [
      {
        ticketId: "SUP001",
        subject: "Payment clarification",
        status: "Resolved",
        createdAt: "2026-09-20",
      },
    ],

    activity: [
      {
        id: "ACT001",
        action: "KYC submitted",
        description: "Partner submitted KYC documents.",
        timestamp: "2026-09-28 10:30",
      },
      {
        id: "ACT002",
        action: "Booking completed",
        description: "Booking BK001 was completed.",
        timestamp: "2026-09-28 16:20",
      },
      {
        id: "ACT003",
        action: "Profile updated",
        description: "Partner updated contact information.",
        timestamp: "2026-09-27 12:15",
      },
    ],
  },

  // ============================================================
  // PAR002
  // ============================================================
  {
    id: "PAR002",
    name: "Suresh Nair",
    email: "suresh@example.com",
    phone: "+91 98765 43211",

    kycStatus: "Approved",
    accountStatus: "Active",

    category: "Electrical & Plumbing",
    categories: [
      "Electrical & Plumbing",
      "Electrical Repair",
      "Plumbing",
    ],

    city: "Hyderabad",
    address: "Kukatpally, Hyderabad",

    rating: 4.5,
    acceptance: 91,
    completion: 94,

    joined: "2025-07-10",

    profile: {
      experience: 8,
      bio: "Experienced electrical and plumbing service professional providing reliable home repair services.",
    },

    kyc: {
      submittedAt: "2026-08-20",
      reviewedAt: "2026-08-22",

      documents: [
        {
          id: "DOC004",
          name: "Aadhaar Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=Aadhaar+Document",
          status: "Verified",
        },
        {
          id: "DOC005",
          name: "PAN Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=PAN+Document",
          status: "Verified",
        },
        {
          id: "DOC006",
          name: "Address Proof",
          type: "pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          status: "Verified",
        },
      ],

      checklist: [
        {
          id: "identity",
          label: "Identity document verified",
          completed: true,
          required: true,
        },
        {
          id: "pan",
          label: "PAN document verified",
          completed: true,
          required: true,
        },
        {
          id: "address",
          label: "Address proof verified",
          completed: true,
          required: true,
        },
        {
          id: "bank",
          label: "Bank account verified",
          completed: true,
          required: true,
        },
        {
          id: "photo",
          label: "Profile photo verified",
          completed: true,
          required: true,
        },
      ],
    },

    performance: {
      completedBookings: 214,
      cancelledBookings: 5,
      averageResponseTime: "10 minutes",
      customerSatisfaction: 92,
    },

    bookings: [
      {
        id: "BK004",
        customer: "Vikram Rao",
        service: "Electrical Repair",
        date: "2026-09-27",
        status: "Completed",
        amount: 750,
      },
      {
        id: "BK005",
        customer: "Meena Shah",
        service: "Plumbing",
        date: "2026-09-24",
        status: "Completed",
        amount: 900,
      },
      {
        id: "BK006",
        customer: "Amit Kumar",
        service: "Electrical Inspection",
        date: "2026-09-30",
        status: "Upcoming",
        amount: 650,
      },
    ],

    earnings: [
      {
        month: "July 2026",
        bookings: 36,
        earnings: 31500,
      },
      {
        month: "August 2026",
        bookings: 41,
        earnings: 36700,
      },
      {
        month: "September 2026",
        bookings: 38,
        earnings: 34200,
      },
    ],

    payouts: [
      {
        id: "PAY003",
        date: "2026-09-24",
        amount: 11200,
        status: "Paid",
      },
      {
        id: "PAY004",
        date: "2026-09-08",
        amount: 9800,
        status: "Paid",
      },
    ],

    reviews: [
      {
        id: "REV003",
        customer: "Vikram Rao",
        rating: 5,
        comment: "Quick and professional electrical repair.",
        date: "2026-09-27",
      },
      {
        id: "REV004",
        customer: "Meena Shah",
        rating: 4,
        comment: "Good plumbing service and clear communication.",
        date: "2026-09-24",
      },
    ],

    support: [
      {
        ticketId: "SUP002",
        subject: "Service category update",
        status: "Resolved",
        createdAt: "2026-08-18",
      },
    ],

    activity: [
      {
        id: "ACT004",
        action: "KYC approved",
        description: "Partner KYC documents were approved.",
        timestamp: "2026-08-22 11:15",
      },
      {
        id: "ACT005",
        action: "Booking completed",
        description: "Booking BK004 was completed.",
        timestamp: "2026-09-27 15:40",
      },
      {
        id: "ACT006",
        action: "Profile updated",
        description: "Partner updated service categories.",
        timestamp: "2026-08-18 09:30",
      },
    ],
  },

  // ============================================================
  // PAR003
  // ============================================================
  {
    id: "PAR003",
    name: "Sandhya Patel",
    email: "sandhya@example.com",
    phone: "+91 98765 43212",

    kycStatus: "Pending",
    accountStatus: "Active",

    category: "Salon & Spa",
    categories: [
      "Salon & Spa",
      "Beauty Services",
    ],

    city: "Mumbai",
    address: "Andheri, Mumbai",

    rating: 4.9,
    acceptance: 89,
    completion: 92,

    joined: "2025-09-05",

    profile: {
      experience: 5,
      bio: "Professional salon and beauty service provider specialising in home salon and spa services.",
    },

    kyc: {
      submittedAt: "2026-09-27",

      documents: [
        {
          id: "DOC007",
          name: "Aadhaar Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=Aadhaar+Document",
          status: "Verified",
        },
        {
          id: "DOC008",
          name: "PAN Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=PAN+Document",
          status: "Pending",
        },
        {
          id: "DOC009",
          name: "Address Proof",
          type: "pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          status: "Pending",
        },
      ],

      checklist: [
        {
          id: "identity",
          label: "Identity document verified",
          completed: true,
          required: true,
        },
        {
          id: "pan",
          label: "PAN document verified",
          completed: false,
          required: true,
        },
        {
          id: "address",
          label: "Address proof verified",
          completed: false,
          required: true,
        },
        {
          id: "bank",
          label: "Bank account verified",
          completed: true,
          required: true,
        },
        {
          id: "photo",
          label: "Profile photo verified",
          completed: true,
          required: true,
        },
      ],
    },

    performance: {
      completedBookings: 186,
      cancelledBookings: 4,
      averageResponseTime: "7 minutes",
      customerSatisfaction: 97,
    },

    bookings: [
      {
        id: "BK007",
        customer: "Neha Kapoor",
        service: "Home Salon",
        date: "2026-09-26",
        status: "Completed",
        amount: 1200,
      },
      {
        id: "BK008",
        customer: "Pooja Mehta",
        service: "Hair Spa",
        date: "2026-09-23",
        status: "Completed",
        amount: 950,
      },
      {
        id: "BK009",
        customer: "Kavita Rao",
        service: "Facial",
        date: "2026-10-01",
        status: "Upcoming",
        amount: 1100,
      },
    ],

    earnings: [
      {
        month: "July 2026",
        bookings: 31,
        earnings: 34400,
      },
      {
        month: "August 2026",
        bookings: 38,
        earnings: 41600,
      },
      {
        month: "September 2026",
        bookings: 35,
        earnings: 39200,
      },
    ],

    payouts: [
      {
        id: "PAY005",
        date: "2026-09-23",
        amount: 12400,
        status: "Paid",
      },
      {
        id: "PAY006",
        date: "2026-09-07",
        amount: 10100,
        status: "Paid",
      },
    ],

    reviews: [
      {
        id: "REV005",
        customer: "Neha Kapoor",
        rating: 5,
        comment: "Excellent salon service at home.",
        date: "2026-09-26",
      },
      {
        id: "REV006",
        customer: "Pooja Mehta",
        rating: 5,
        comment: "Very polite and professional.",
        date: "2026-09-23",
      },
    ],

    support: [
      {
        ticketId: "SUP003",
        subject: "KYC document clarification",
        status: "Open",
        createdAt: "2026-09-28",
      },
    ],

    activity: [
      {
        id: "ACT007",
        action: "KYC submitted",
        description: "Partner submitted KYC documents for review.",
        timestamp: "2026-09-27 10:00",
      },
      {
        id: "ACT008",
        action: "Booking completed",
        description: "Booking BK007 was completed.",
        timestamp: "2026-09-26 17:10",
      },
      {
        id: "ACT009",
        action: "Document uploaded",
        description: "Partner uploaded PAN document.",
        timestamp: "2026-09-28 09:45",
      },
    ],
  },

  // ============================================================
  // PAR004
  // ============================================================
  {
    id: "PAR004",
    name: "Arjun Singh",
    email: "arjun@example.com",
    phone: "+91 98765 43213",

    kycStatus: "Rejected",
    accountStatus: "Inactive",

    category: "AC Repair",
    categories: [
      "AC Repair",
      "AC Maintenance",
    ],

    city: "Pune",
    address: "Baner, Pune",

    rating: 3.8,
    acceptance: 72,
    completion: 78,

    joined: "2025-11-12",

    profile: {
      experience: 4,
      bio: "AC repair and maintenance service professional.",
    },

    kyc: {
      submittedAt: "2026-09-15",
      reviewedAt: "2026-09-17",

      documents: [
        {
          id: "DOC010",
          name: "Aadhaar Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=Aadhaar+Document",
          status: "Verified",
        },
        {
          id: "DOC011",
          name: "PAN Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=PAN+Document",
          status: "Rejected",
        },
        {
          id: "DOC012",
          name: "Address Proof",
          type: "pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          status: "Rejected",
        },
      ],

      checklist: [
        {
          id: "identity",
          label: "Identity document verified",
          completed: true,
          required: true,
        },
        {
          id: "pan",
          label: "PAN document verified",
          completed: false,
          required: true,
        },
        {
          id: "address",
          label: "Address proof verified",
          completed: false,
          required: true,
        },
        {
          id: "bank",
          label: "Bank account verified",
          completed: true,
          required: true,
        },
        {
          id: "photo",
          label: "Profile photo verified",
          completed: true,
          required: true,
        },
      ],
    },

    performance: {
      completedBookings: 102,
      cancelledBookings: 14,
      averageResponseTime: "18 minutes",
      customerSatisfaction: 76,
    },

    bookings: [
      {
        id: "BK010",
        customer: "Rohit Shah",
        service: "AC Repair",
        date: "2026-09-12",
        status: "Completed",
        amount: 900,
      },
      {
        id: "BK011",
        customer: "Nitin Rao",
        service: "AC Maintenance",
        date: "2026-09-09",
        status: "Cancelled",
        amount: 700,
      },
      {
        id: "BK012",
        customer: "Deepak Kumar",
        service: "AC Repair",
        date: "2026-09-05",
        status: "Completed",
        amount: 850,
      },
    ],

    earnings: [
      {
        month: "July 2026",
        bookings: 20,
        earnings: 18200,
      },
      {
        month: "August 2026",
        bookings: 24,
        earnings: 21600,
      },
      {
        month: "September 2026",
        bookings: 18,
        earnings: 15900,
      },
    ],

    payouts: [
      {
        id: "PAY007",
        date: "2026-09-10",
        amount: 7200,
        status: "Paid",
      },
      {
        id: "PAY008",
        date: "2026-08-25",
        amount: 8100,
        status: "Paid",
      },
    ],

    reviews: [
      {
        id: "REV007",
        customer: "Rohit Shah",
        rating: 4,
        comment: "Repair was completed successfully.",
        date: "2026-09-12",
      },
      {
        id: "REV008",
        customer: "Deepak Kumar",
        rating: 3,
        comment: "Service was okay but took longer than expected.",
        date: "2026-09-05",
      },
    ],

    support: [
      {
        ticketId: "SUP004",
        subject: "KYC rejection clarification",
        status: "Open",
        createdAt: "2026-09-18",
      },
    ],

    activity: [
      {
        id: "ACT010",
        action: "KYC rejected",
        description: "KYC documents were rejected during review.",
        timestamp: "2026-09-17 14:20",
      },
      {
        id: "ACT011",
        action: "Booking completed",
        description: "Booking BK010 was completed.",
        timestamp: "2026-09-12 16:30",
      },
      {
        id: "ACT012",
        action: "Account status changed",
        description: "Partner account was marked inactive.",
        timestamp: "2026-09-17 14:25",
      },
    ],
  },

  // ============================================================
  // PAR005
  // ============================================================
  {
    id: "PAR005",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43214",

    kycStatus: "Approved",
    accountStatus: "Active",

    category: "Home Cleaning",
    categories: [
      "Home Cleaning",
      "Deep Cleaning",
    ],

    city: "Bangalore",
    address: "Whitefield, Bangalore",

    rating: 4.6,
    acceptance: 88,
    completion: 91,

    joined: "2025-08-21",

    profile: {
      experience: 7,
      bio: "Experienced residential cleaning service professional.",
    },

    kyc: {
      submittedAt: "2026-08-10",
      reviewedAt: "2026-08-12",

      documents: [
        {
          id: "DOC013",
          name: "Aadhaar Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=Aadhaar+Document",
          status: "Verified",
        },
        {
          id: "DOC014",
          name: "PAN Card",
          type: "image",
          url: "https://placehold.co/900x600/png?text=PAN+Document",
          status: "Verified",
        },
        {
          id: "DOC015",
          name: "Address Proof",
          type: "pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          status: "Verified",
        },
      ],

      checklist: [
        {
          id: "identity",
          label: "Identity document verified",
          completed: true,
          required: true,
        },
        {
          id: "pan",
          label: "PAN document verified",
          completed: true,
          required: true,
        },
        {
          id: "address",
          label: "Address proof verified",
          completed: true,
          required: true,
        },
        {
          id: "bank",
          label: "Bank account verified",
          completed: true,
          required: true,
        },
        {
          id: "photo",
          label: "Profile photo verified",
          completed: true,
          required: true,
        },
      ],
    },

    performance: {
      completedBookings: 201,
      cancelledBookings: 7,
      averageResponseTime: "9 minutes",
      customerSatisfaction: 94,
    },

    bookings: [
      {
        id: "BK013",
        customer: "Anjali Verma",
        service: "Home Cleaning",
        date: "2026-09-26",
        status: "Completed",
        amount: 800,
      },
      {
        id: "BK014",
        customer: "Kiran Rao",
        service: "Deep Cleaning",
        date: "2026-09-22",
        status: "Completed",
        amount: 1350,
      },
      {
        id: "BK015",
        customer: "Shweta Kumar",
        service: "Home Cleaning",
        date: "2026-10-02",
        status: "Upcoming",
        amount: 900,
      },
    ],

    earnings: [
      {
        month: "July 2026",
        bookings: 34,
        earnings: 29800,
      },
      {
        month: "August 2026",
        bookings: 40,
        earnings: 36500,
      },
      {
        month: "September 2026",
        bookings: 37,
        earnings: 33800,
      },
    ],

    payouts: [
      {
        id: "PAY009",
        date: "2026-09-23",
        amount: 10900,
        status: "Paid",
      },
      {
        id: "PAY010",
        date: "2026-09-09",
        amount: 9700,
        status: "Paid",
      },
    ],

    reviews: [
      {
        id: "REV009",
        customer: "Anjali Verma",
        rating: 5,
        comment: "Very neat and professional cleaning.",
        date: "2026-09-26",
      },
      {
        id: "REV010",
        customer: "Kiran Rao",
        rating: 4,
        comment: "Good quality service and punctual arrival.",
        date: "2026-09-22",
      },
    ],

    support: [
      {
        ticketId: "SUP005",
        subject: "Payout confirmation",
        status: "Resolved",
        createdAt: "2026-09-18",
      },
    ],

    activity: [
      {
        id: "ACT013",
        action: "KYC approved",
        description: "Partner KYC documents were approved.",
        timestamp: "2026-08-12 13:10",
      },
      {
        id: "ACT014",
        action: "Booking completed",
        description: "Booking BK013 was completed.",
        timestamp: "2026-09-26 15:45",
      },
      {
        id: "ACT015",
        action: "Profile updated",
        description: "Partner updated profile information.",
        timestamp: "2026-09-18 11:20",
      },
    ],
  },
];