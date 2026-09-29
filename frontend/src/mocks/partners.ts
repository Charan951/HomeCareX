export interface MockPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: "Approved" | "Pending" | "Rejected";
  accountStatus: "Active" | "Inactive" | "Suspended";
  category: string;
  city: string;
  rating: number;
  acceptance: number;
  completion: number;
}

export const PARTNERS: MockPartner[] = [
  {
    id: "PAR001",
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    phone: "+91 98765 43210",
    kycStatus: "Approved",
    accountStatus: "Active",
    category: "Home Cleaning",
    city: "Hyderabad",
    rating: 4.8,
    acceptance: 95,
    completion: 97,
  },
  {
    id: "PAR002",
    name: "Suresh Nair",
    email: "suresh@example.com",
    phone: "+91 98765 43211",
    kycStatus: "Approved",
    accountStatus: "Active",
    category: "Electrical & Plumbing",
    city: "Hyderabad",
    rating: 4.5,
    acceptance: 91,
    completion: 94,
  },
  {
    id: "PAR003",
    name: "Sandhya Patel",
    email: "sandhya@example.com",
    phone: "+91 98765 43212",
    kycStatus: "Pending",
    accountStatus: "Active",
    category: "Salon & Spa",
    city: "Mumbai",
    rating: 4.9,
    acceptance: 89,
    completion: 92,
  },
  {
    id: "PAR004",
    name: "Arjun Singh",
    email: "arjun@example.com",
    phone: "+91 98765 43213",
    kycStatus: "Rejected",
    accountStatus: "Inactive",
    category: "AC Repair",
    city: "Pune",
    rating: 3.8,
    acceptance: 72,
    completion: 78,
  },
  {
    id: "PAR005",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43214",
    kycStatus: "Approved",
    accountStatus: "Active",
    category: "Home Cleaning",
    city: "Bangalore",
    rating: 4.6,
    acceptance: 88,
    completion: 91,
  },
];