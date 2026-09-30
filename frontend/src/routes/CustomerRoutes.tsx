import { Routes, Route } from "react-router-dom";

import CustomerLayout from "../layouts/CustomerLayout";

import Dashboard from "../pages/customer/Dashboard";
import Addresses from "../pages/customer/Addresses";
import Bookings from "../pages/customer/Bookings";
import BookingDetails from "../pages/customer/BookingDetails";
import Categories from "../pages/customer/Categories";
import Notifications from "../pages/customer/Notifications";
import Payments from "../pages/customer/Payments";
import Profile from "../pages/customer/Profile";
import Referrals from "../pages/customer/Referrals";
import Reviews from "../pages/customer/Reviews";
import Services from "../pages/customer/Services";
import Support from "../pages/customer/Support";
import Tracking from "../pages/customer/Tracking";
import Wallet from "../pages/customer/Wallet";

import Tickets from "@/pages/customer/Tickets";
import BookServiceShell from "../pages/customer/Book";

/**
 * CustomerRoutes — every route the Customer Dashboard serves,
 * nested inside CustomerLayout.
 */
export default function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/addresses" element={<Addresses />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/:id" element={<BookingDetails />} />
        <Route path="/book/:serviceSlug" element={<BookServiceShell />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/services" element={<Services />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/tickets" element={<Tickets />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/wallet" element={<Wallet />} />
      </Route>
    </Routes>
  );
}