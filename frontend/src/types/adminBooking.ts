export type BookingStatus =
  | "created"
  | "searching_for_partner"
  | "assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "rated"
  | "cancelled_by_customer"
  | "cancelled_by_partner"
  | "no_show"
  | "disputed";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

export type TimelineActorType =
  | "Admin"
  | "Customer"
  | "Partner"
  | "System";

export interface BookingCustomer {
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
  category: string;
  city: string;
}

export interface BookingService {
  id: string;
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

export interface AdminBooking {
  id: string;
  customer: BookingCustomer;
  partner: BookingPartner | null;
  service: BookingService;
  city: string;
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
  search: string;
  status: BookingStatus | "";
  city: string;
  category: string;
  customer: string;
  partner: string;
  date: string;
  paymentStatus: PaymentStatus | "";
}

export interface AssignPartnerRequest {
  partnerId: string;
}

export interface StatusOverrideRequest {
  status: BookingStatus;
  reason: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface BookingPartnerCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  categories: string[];
  cities: string[];
  areas: string[];
  kycStatus: "Approved" | "Pending" | "Rejected";
  accountStatus: "Active" | "Inactive" | "Suspended";
  available: boolean;
  conflictBookingIds: string[];
}