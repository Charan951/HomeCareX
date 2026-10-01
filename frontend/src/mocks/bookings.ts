export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export type TimelineActorType =
  | 'Admin'
  | 'Customer'
  | 'Partner'
  | 'System';

export interface BookingPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface BookingPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface BookingService {
  name: string;
  category: string;
  durationMinutes: number;
}

export interface BookingAddress {
  line1: string;
  line2?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookingPricing {
  baseAmount: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

export interface BookingPayment {
  paymentId: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
}

export interface BookingTimelineItem {
  id: string;
  timestamp: string;
  actor: string;
  actorType: TimelineActorType;
  status: BookingStatus;
  note: string;
  location?: string;
}

export interface Booking {
  id: string;
  customer: BookingPerson;
  partner: BookingPartner | null;
  service: BookingService;
  address: BookingAddress;
  slot: BookingSlot;
  pricing: BookingPricing;
  payment: BookingPayment;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  timeline: BookingTimelineItem[];
}

export interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  city?: string;
  category?: string;
  customer?: string;
  partner?: string;
  date?: string;
  paymentStatus?: PaymentStatus;
}

export interface BookingPartnerCandidate extends BookingPartner {
  categories: string[];
  cities: string[];
  areas: string[];
  kycStatus: 'Approved' | 'Pending' | 'Rejected';
  accountStatus: 'Active' | 'Suspended' | 'Inactive';
  available: boolean;
  conflictBookingIds: string[];
}

export interface BookingAuditEntry {
  id: string;
  bookingId: string;
  action: 'ASSIGN' | 'STATUS_OVERRIDE' | 'CANCEL';
  actor: string;
  reason: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export const BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Confirmed',
  'Assigned',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Pending',
  'Paid',
  'Failed',
  'Refunded',
];

export const MOCK_PARTNER_CANDIDATES: BookingPartnerCandidate[] = [
  {
    id: 'PAR001',
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    phone: '+91 90000 10001',
    categories: ['Home Cleaning'],
    cities: ['Hyderabad'],
    areas: ['Madhapur', 'Banjara Hills'],
    kycStatus: 'Approved',
    accountStatus: 'Active',
    available: true,
    conflictBookingIds: [],
  },
  {
    id: 'PAR002',
    name: 'Suresh Nair',
    email: 'suresh@example.com',
    phone: '+91 90000 10002',
    categories: ['Electrical & Plumbing'],
    cities: ['Hyderabad'],
    areas: ['Gachibowli', 'Madhapur'],
    kycStatus: 'Approved',
    accountStatus: 'Active',
    available: true,
    conflictBookingIds: ['BK1002'],
  },
  {
    id: 'PAR003',
    name: 'Sandhya Rao',
    email: 'sandhya@example.com',
    phone: '+91 90000 10003',
    categories: ['Salon & Spa'],
    cities: ['Mumbai'],
    areas: ['Andheri'],
    kycStatus: 'Approved',
    accountStatus: 'Active',
    available: true,
    conflictBookingIds: [],
  },
  {
    id: 'PAR004',
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    phone: '+91 90000 10004',
    categories: ['AC Repair'],
    cities: ['Pune'],
    areas: ['Kothrud'],
    kycStatus: 'Approved',
    accountStatus: 'Active',
    available: false,
    conflictBookingIds: [],
  },
  {
    id: 'PAR005',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 90000 10005',
    categories: ['Home Cleaning'],
    cities: ['Bengaluru'],
    areas: ['Indiranagar'],
    kycStatus: 'Approved',
    accountStatus: 'Active',
    available: true,
    conflictBookingIds: [],
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK1001',
    customer: {
      id: 'CUS001',
      name: 'Ananya Reddy',
      email: 'ananya@example.com',
      phone: '+91 90100 10001',
    },
    partner: {
      id: 'PAR001',
      name: 'Ramesh Kumar',
      email: 'ramesh@example.com',
      phone: '+91 90000 10001',
    },
    service: {
      name: 'Deep Home Cleaning',
      category: 'Home Cleaning',
      durationMinutes: 180,
    },
    address: {
      line1: '12, Lake View Road',
      area: 'Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
    },
    slot: {
      date: '2026-09-30',
      startTime: '10:00',
      endTime: '13:00',
    },
    pricing: {
      baseAmount: 1800,
      tax: 324,
      discount: 124,
      totalAmount: 2000,
    },
    payment: {
      paymentId: 'PAY1001',
      method: 'UPI',
      status: 'Paid',
      amount: 2000,
      paidAt: '2026-09-29T08:20:00.000Z',
    },
    status: 'Confirmed',
    createdAt: '2026-09-28T06:30:00.000Z',
    updatedAt: '2026-09-29T08:20:00.000Z',
    timeline: [
      {
        id: 'TL1001',
        timestamp: '2026-09-28T06:30:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Pending',
        note: 'Booking created.',
      },
      {
        id: 'TL1002',
        timestamp: '2026-09-28T06:45:00.000Z',
        actor: 'Admin',
        actorType: 'Admin',
        status: 'Confirmed',
        note: 'Booking confirmed by operations.',
      },
      {
        id: 'TL1003',
        timestamp: '2026-09-29T08:20:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Confirmed',
        note: 'Payment received.',
      },
    ],
  },
  {
    id: 'BK1002',
    customer: {
      id: 'CUS002',
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      phone: '+91 90100 10002',
    },
    partner: {
      id: 'PAR002',
      name: 'Suresh Nair',
      email: 'suresh@example.com',
      phone: '+91 90000 10002',
    },
    service: {
      name: 'Electrical Repair',
      category: 'Electrical & Plumbing',
      durationMinutes: 90,
    },
    address: {
      line1: '44, Tech Park Road',
      area: 'Gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032',
    },
    slot: {
      date: '2026-10-01',
      startTime: '14:00',
      endTime: '15:30',
    },
    pricing: {
      baseAmount: 900,
      tax: 162,
      discount: 62,
      totalAmount: 1000,
    },
    payment: {
      paymentId: 'PAY1002',
      method: 'Card',
      status: 'Paid',
      amount: 1000,
      paidAt: '2026-09-29T10:15:00.000Z',
    },
    status: 'Assigned',
    createdAt: '2026-09-28T09:15:00.000Z',
    updatedAt: '2026-09-29T10:15:00.000Z',
    timeline: [
      {
        id: 'TL2001',
        timestamp: '2026-09-28T09:15:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Pending',
        note: 'Booking created.',
      },
      {
        id: 'TL2002',
        timestamp: '2026-09-29T10:15:00.000Z',
        actor: 'Admin',
        actorType: 'Admin',
        status: 'Assigned',
        note: 'Partner assigned by operations.',
      },
    ],
  },
  {
    id: 'BK1003',
    customer: {
      id: 'CUS003',
      name: 'Meera Shah',
      email: 'meera@example.com',
      phone: '+91 90100 10003',
    },
    partner: {
      id: 'PAR003',
      name: 'Sandhya Rao',
      email: 'sandhya@example.com',
      phone: '+91 90000 10003',
    },
    service: {
      name: 'Salon At Home',
      category: 'Salon & Spa',
      durationMinutes: 120,
    },
    address: {
      line1: '18, Green Avenue',
      area: 'Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
    },
    slot: {
      date: '2026-10-02',
      startTime: '11:00',
      endTime: '13:00',
    },
    pricing: {
      baseAmount: 1500,
      tax: 270,
      discount: 170,
      totalAmount: 1600,
    },
    payment: {
      paymentId: 'PAY1003',
      method: 'UPI',
      status: 'Pending',
      amount: 1600,
    },
    status: 'Pending',
    createdAt: '2026-09-29T07:00:00.000Z',
    updatedAt: '2026-09-29T07:00:00.000Z',
    timeline: [
      {
        id: 'TL3001',
        timestamp: '2026-09-29T07:00:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Pending',
        note: 'Booking created and awaiting payment.',
      },
    ],
  },
  {
    id: 'BK1004',
    customer: {
      id: 'CUS004',
      name: 'Vikram Joshi',
      email: 'vikram@example.com',
      phone: '+91 90100 10004',
    },
    partner: null,
    service: {
      name: 'AC Service',
      category: 'AC Repair',
      durationMinutes: 90,
    },
    address: {
      line1: '8, Park Street',
      area: 'Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    slot: {
      date: '2026-10-03',
      startTime: '09:00',
      endTime: '10:30',
    },
    pricing: {
      baseAmount: 1100,
      tax: 198,
      discount: 98,
      totalAmount: 1200,
    },
    payment: {
      paymentId: 'PAY1004',
      method: 'Cash',
      status: 'Pending',
      amount: 1200,
    },
    status: 'Confirmed',
    createdAt: '2026-09-29T11:10:00.000Z',
    updatedAt: '2026-09-29T11:10:00.000Z',
    timeline: [
      {
        id: 'TL4001',
        timestamp: '2026-09-29T11:10:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Confirmed',
        note: 'Booking confirmed. Partner assignment pending.',
      },
    ],
  },
  {
    id: 'BK1005',
    customer: {
      id: 'CUS005',
      name: 'Neha Iyer',
      email: 'neha@example.com',
      phone: '+91 90100 10005',
    },
    partner: {
      id: 'PAR005',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91 90000 10005',
    },
    service: {
      name: 'Standard Home Cleaning',
      category: 'Home Cleaning',
      durationMinutes: 120,
    },
    address: {
      line1: '22, 5th Cross',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    slot: {
      date: '2026-09-27',
      startTime: '10:00',
      endTime: '12:00',
    },
    pricing: {
      baseAmount: 1200,
      tax: 216,
      discount: 116,
      totalAmount: 1300,
    },
    payment: {
      paymentId: 'PAY1005',
      method: 'Card',
      status: 'Paid',
      amount: 1300,
      paidAt: '2026-09-27T07:00:00.000Z',
    },
    status: 'Completed',
    createdAt: '2026-09-25T06:00:00.000Z',
    updatedAt: '2026-09-27T12:30:00.000Z',
    timeline: [
      {
        id: 'TL5001',
        timestamp: '2026-09-25T06:00:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Pending',
        note: 'Booking created.',
      },
      {
        id: 'TL5002',
        timestamp: '2026-09-27T12:30:00.000Z',
        actor: 'Partner',
        actorType: 'Partner',
        status: 'Completed',
        note: 'Service completed successfully.',
        location: 'Indiranagar, Bengaluru',
      },
    ],
  },
  {
    id: 'BK1006',
    customer: {
      id: 'CUS006',
      name: 'Kiran Rao',
      email: 'kiran@example.com',
      phone: '+91 90100 10006',
    },
    partner: null,
    service: {
      name: 'Home Cleaning',
      category: 'Home Cleaning',
      durationMinutes: 120,
    },
    address: {
      line1: '5, Central Avenue',
      area: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    slot: {
      date: '2026-10-04',
      startTime: '15:00',
      endTime: '17:00',
    },
    pricing: {
      baseAmount: 1200,
      tax: 216,
      discount: 116,
      totalAmount: 1300,
    },
    payment: {
      paymentId: 'PAY1006',
      method: 'UPI',
      status: 'Failed',
      amount: 1300,
    },
    status: 'Confirmed',
    createdAt: '2026-09-29T13:00:00.000Z',
    updatedAt: '2026-09-29T13:05:00.000Z',
    timeline: [
      {
        id: 'TL6001',
        timestamp: '2026-09-29T13:00:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Confirmed',
        note: 'Booking created.',
      },
      {
        id: 'TL6002',
        timestamp: '2026-09-29T13:05:00.000Z',
        actor: 'System',
        actorType: 'System',
        status: 'Confirmed',
        note: 'Payment attempt failed.',
      },
    ],
  },
];