// import React from 'react';
// import AppRoutes from './routes/AppRoutes';

// export const App: React.FC = () => {
//   return <AppRoutes />;
// };

// export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import Dashboard from "./pages/customer/Dashboard";
import Addresses from "./pages/customer/Addresses";
import Bookings from "./pages/customer/Bookings";
import BookingDetails from "./pages/customer/BookingDetails";
import Categories from "./pages/customer/Categories";
import Notifications from "./pages/customer/Notifications";
import Payments from "./pages/customer/Payments";
import Profile from "./pages/customer/Profile";
import Referrals from "./pages/customer/Referrals";
import Reviews from "./pages/customer/Reviews";
import Services from "./pages/customer/Services";
import Support from "./pages/customer/Support";
import Tracking from "./pages/customer/Tracking";
import Wallet from "./pages/customer/Wallet";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <CustomerLayout
              userName="Ananya Rao"
              notificationCount={3}
              onLogout={() => console.log("logout clicked")}
            />
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/services" element={<Services />} />
          <Route path="/support" element={<Support />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/wallet" element={<Wallet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

