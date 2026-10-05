// ============================================================
// Category
// ============================================================

export interface MockCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  serviceCount: number;
  link: string;
}

export const POPULAR_CATEGORIES: MockCategory[] = [
  {
    id: "CAT001",
    name: "Home Cleaning",
    description: "Professional cleaning services for your home.",
    image: "/images/categories/home-cleaning.jpg",
    serviceCount: 12,
    link: "/services?category=home-cleaning",
  },
  {
    id: "CAT002",
    name: "Electrical",
    description: "Reliable electrical services for your home.",
    image: "/images/categories/electrical.jpg",
    serviceCount: 10,
    link: "/services?category=electrical",
  },
  {
    id: "CAT003",
    name: "Plumbing",
    description: "Quick and reliable plumbing services.",
    image: "/images/categories/plumbing.jpg",
    serviceCount: 8,
    link: "/services?category=plumbing",
  },
  {
    id: "CAT004",
    name: "AC Repair",
    description: "Professional AC repair and maintenance.",
    image: "/images/categories/ac-repair.jpg",
    serviceCount: 6,
    link: "/services?category=ac-repair",
  },
];

// ============================================================
// Services
// ============================================================

export interface MockService {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
}

export const SERVICES: MockService[] = [
  {
    id: "SRV001",
    name: "Deep Home Cleaning",
    description: "Complete deep cleaning service for your home.",
    categoryId: "CAT001",
    price: 1499,
    duration: "3 hrs",
    rating: 4.8,
    reviewCount: 214,
  },
  {
    id: "SRV002",
    name: "Sofa Cleaning",
    description: "Professional sofa and upholstery cleaning.",
    categoryId: "CAT001",
    price: 899,
    duration: "1.5 hrs",
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: "SRV003",
    name: "Electrical Repair",
    description: "General electrical repair and installation.",
    categoryId: "CAT002",
    price: 499,
    duration: "1 hr",
    rating: 4.6,
    reviewCount: 128,
  },
  {
    id: "SRV004",
    name: "Plumbing Repair",
    description: "Reliable plumbing repair and maintenance.",
    categoryId: "CAT003",
    price: 399,
    duration: "1 hr",
    rating: 4.5,
    reviewCount: 112,
  },
  {
    id: "SRV005",
    name: "AC Service",
    description: "AC servicing and maintenance at your doorstep.",
    categoryId: "CAT004",
    price: 599,
    duration: "1 hr",
    rating: 4.6,
    reviewCount: 187,
  },
];

// ============================================================
// Banners
// ============================================================

export interface MockBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  link: string;
}

export const BANNERS: MockBanner[] = [
  {
    id: "BAN001",
    title: "Professional Home Services",
    description: "Book trusted professionals for your home.",
    image: "/images/banners/home-service.jpg",
    buttonText: "Book Now",
    link: "/services",
  },
  {
    id: "BAN002",
    title: "Quality Services at Your Doorstep",
    description: "Easy, reliable and convenient home services.",
    image: "/images/banners/quality-service.jpg",
    buttonText: "Explore Services",
    link: "/services",
  },
];

// ============================================================
// Testimonials
// ============================================================

export interface MockTestimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  image?: string;
}

export const TESTIMONIALS: MockTestimonial[] = [
  {
    id: "TEST001",
    name: "Anita Sharma",
    role: "Customer",
    message:
      "The service was quick, professional and very convenient.",
    rating: 5,
  },
  {
    id: "TEST002",
    name: "Rahul Kumar",
    role: "Customer",
    message:
      "I was able to book a reliable professional very easily.",
    rating: 5,
  },
  {
    id: "TEST003",
    name: "Priya Reddy",
    role: "Customer",
    message:
      "The overall experience was smooth and the service quality was excellent.",
    rating: 4,
  },
];