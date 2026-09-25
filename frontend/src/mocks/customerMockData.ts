// Mock data for the Customer Dashboard, sourced from the HomeCareX
// Feature Document, PRD, and TRD (service categories, booking lifecycle,
// payment methods, monetization model, etc.). Swap these for real API
// calls once the backend endpoints listed in the TRD (§6 API
// Specification) are wired up.

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji stand-in for a category icon
  serviceCount: number;
}

export const CATEGORIES: Category[] = [
  { id: "cleaning", name: "Home Cleaning", description: "Deep cleaning, bathroom, kitchen, sofa & carpet shampooing", icon: "🧹", serviceCount: 6 },
  { id: "appliance", name: "Appliance Repair & Service", description: "AC, washing machine, refrigerator, RO/water purifier", icon: "🔧", serviceCount: 8 },
  { id: "salon", name: "Salon & Spa", description: "At-home beauty, massage, and grooming for women & men", icon: "💆", serviceCount: 10 },
  { id: "electrical", name: "Electrical & Plumbing", description: "Wiring, fixtures, leak repair, fittings", icon: "💡", serviceCount: 7 },
  { id: "painting", name: "Painting & Waterproofing", description: "Interior/exterior painting, damp-proofing", icon: "🎨", serviceCount: 5 },
  { id: "pest", name: "Pest Control", description: "General pest, termite, and mosquito treatments", icon: "🐜", serviceCount: 4 },
  { id: "carpentry", name: "Carpentry & Furniture Assembly", description: "Furniture assembly, repairs, custom fittings", icon: "🪚", serviceCount: 6 },
];

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
}

export const SERVICES: Service[] = [
  { id: "svc-1", categoryId: "cleaning", name: "Deep Home Cleaning", price: 1499, duration: "3 hrs", rating: 4.8, reviewCount: 2140 },
  { id: "svc-2", categoryId: "cleaning", name: "Sofa & Carpet Shampooing", price: 899, duration: "1.5 hrs", rating: 4.7, reviewCount: 980 },
  { id: "svc-3", categoryId: "appliance", name: "AC Service & Gas Refill", price: 599, duration: "1 hr", rating: 4.6, reviewCount: 3210 },
  { id: "svc-4", categoryId: "appliance", name: "RO/Water Purifier Service", price: 399, duration: "45 min", rating: 4.5, reviewCount: 1120 },
  { id: "svc-5", categoryId: "salon", name: "At-Home Spa for Women", price: 1299, duration: "2 hrs", rating: 4.9, reviewCount: 1560 },
  { id: "svc-6", categoryId: "electrical", name: "Electrician Visit (General)", price: 249, duration: "30 min", rating: 4.4, reviewCount: 870 },
  { id: "svc-7", categoryId: "painting", name: "Room Painting (per room)", price: 3499, duration: "1 day", rating: 4.6, reviewCount: 430 },
  { id: "svc-8", categoryId: "pest", name: "General Pest Control", price: 799, duration: "1 hr", rating: 4.5, reviewCount: 1980 },
  { id: "svc-9", categoryId: "carpentry", name: "Furniture Assembly", price: 349, duration: "1 hr", rating: 4.7, reviewCount: 640 },
];

export type BookingStatus =
  | "Confirmed"
  | "Partner Assigned"
  | "En Route"
  | "Arrived"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface Booking {
  id: string;
  service: string;
  category: string;
  status: BookingStatus;
  scheduledAt: string;
  address: string;
  partner: { name: string; rating: number } | null;
  price: number;
  paymentMethod: "UPI" | "Card" | "Netbanking" | "Wallet" | "Cash on Service";
}

export const BOOKINGS: Booking[] = [
  { id: "BK-10231", service: "Deep Home Cleaning", category: "Home Cleaning", status: "In Progress", scheduledAt: "Today, 2:00 PM", address: "Flat 302, Manjeera Trinity, Kukatpally", partner: { name: "Ramesh K.", rating: 4.8 }, price: 1499, paymentMethod: "UPI" },
  { id: "BK-10228", service: "AC Service & Gas Refill", category: "Appliance Repair & Service", status: "Confirmed", scheduledAt: "Tomorrow, 11:00 AM", address: "Flat 302, Manjeera Trinity, Kukatpally", partner: null, price: 599, paymentMethod: "Card" },
  { id: "BK-10214", service: "At-Home Spa for Women", category: "Salon & Spa", status: "Completed", scheduledAt: "18 Sep, 4:30 PM", address: "Office - WeWork, Hitech City", partner: { name: "Sandhya P.", rating: 4.9 }, price: 1299, paymentMethod: "Wallet" },
  { id: "BK-10201", service: "Electrician Visit (General)", category: "Electrical & Plumbing", status: "Completed", scheduledAt: "10 Sep, 10:00 AM", address: "Flat 302, Manjeera Trinity, Kukatpally", partner: { name: "Suresh N.", rating: 4.4 }, price: 249, paymentMethod: "Cash on Service" },
  { id: "BK-10190", service: "General Pest Control", category: "Pest Control", status: "Cancelled", scheduledAt: "2 Sep, 9:00 AM", address: "Flat 302, Manjeera Trinity, Kukatpally", partner: null, price: 799, paymentMethod: "UPI" },
];

export const ACTIVE_BOOKING = BOOKINGS[0];

export const TRACKING_TIMELINE: { step: BookingStatus | "Searching for Partner"; done: boolean; time?: string }[] = [
  { step: "Confirmed", done: true, time: "1:10 PM" },
  { step: "Searching for Partner", done: true, time: "1:12 PM" },
  { step: "Partner Assigned", done: true, time: "1:18 PM" },
  { step: "En Route", done: true, time: "1:40 PM" },
  { step: "Arrived", done: true, time: "1:58 PM" },
  { step: "In Progress", done: true, time: "2:02 PM" },
  { step: "Completed", done: false },
];

export interface Address {
  id: string;
  label: string;
  line: string;
  city: string;
  isDefault: boolean;
}

export const ADDRESSES: Address[] = [
  { id: "addr-1", label: "Home", line: "Flat 302, Manjeera Trinity, Kukatpally", city: "Hyderabad, Telangana 500072", isDefault: true },
  { id: "addr-2", label: "Office", line: "WeWork, Prestige Tech Park, Hitech City", city: "Hyderabad, Telangana 500081", isDefault: false },
  { id: "addr-3", label: "Parents' Home", line: "12-4-56, Warangal Main Rd", city: "Warangal, Telangana 506002", isDefault: false },
];

export const WALLET_BALANCE = 640;

export interface WalletTxn {
  id: string;
  description: string;
  date: string;
  amount: number; // positive = credit, negative = debit
}

export const WALLET_TRANSACTIONS: WalletTxn[] = [
  { id: "wtx-1", description: "Refund — Booking BK-10190 (Cancelled)", date: "2 Sep", amount: 799 },
  { id: "wtx-2", description: "Paid for At-Home Spa (BK-10214)", date: "18 Sep", amount: -1299 },
  { id: "wtx-3", description: "Referral bonus — Priya joined", date: "20 Sep", amount: 150 },
  { id: "wtx-4", description: "Added via UPI", date: "22 Sep", amount: 1000 },
];

export interface PaymentMethod {
  id: string;
  type: "UPI" | "Card";
  label: string;
  isDefault: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-1", type: "UPI", label: "ananya@okhdfcbank", isDefault: true },
  { id: "pm-2", type: "Card", label: "HDFC Credit •••• 4821", isDefault: false },
];

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "booking" | "offer" | "reminder";
}

export const NOTIFICATIONS: Notification[] = [
  { id: "n-1", title: "Partner is on the way", message: "Ramesh K. is en route for your Deep Home Cleaning booking.", time: "10 min ago", read: false, type: "booking" },
  { id: "n-2", title: "20% off Salon & Spa", message: "Book an at-home spa session this week and save 20%.", time: "2 hrs ago", read: false, type: "offer" },
  { id: "n-3", title: "Booking reminder", message: "Your AC Service is scheduled for tomorrow, 11:00 AM.", time: "5 hrs ago", read: true, type: "reminder" },
  { id: "n-4", title: "Booking completed", message: "Your Electrician Visit was marked complete. Rate your experience.", time: "2 days ago", read: true, type: "booking" },
];

export interface Review {
  id: string;
  service: string;
  partner: string;
  rating: number;
  comment: string;
  date: string;
}

export const REVIEWS: Review[] = [
  { id: "rv-1", service: "At-Home Spa for Women", partner: "Sandhya P.", rating: 5, comment: "Very professional and punctual. Loved the service!", date: "18 Sep" },
  { id: "rv-2", service: "Electrician Visit", partner: "Suresh N.", rating: 4, comment: "Fixed the wiring quickly, good work.", date: "10 Sep" },
];

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "Open" | "In Review" | "Resolved";
  slaDue: string;
  date: string;
}

export const SUPPORT_TICKETS: SupportTicket[] = [
  { id: "TK-4021", subject: "Extra charge added without approval", category: "Billing", status: "In Review", slaDue: "Today, 6:00 PM", date: "24 Sep" },
  { id: "TK-3988", subject: "Partner arrived late", category: "Service Quality", status: "Resolved", slaDue: "—", date: "10 Sep" },
];

export const REFERRAL = {
  code: "ANANYA150",
  rewardPerReferral: 150,
  totalInvited: 6,
  totalEarned: 900,
};

export const PROFILE = {
  name: "Ananya Rao",
  phone: "+91 98765 43210",
  email: "ananya.rao@example.com",
  language: "English",
  memberSince: "March 2026",
};
