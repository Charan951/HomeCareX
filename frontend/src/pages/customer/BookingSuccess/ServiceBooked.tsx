import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";

export default function ServiceBooked() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch actual data from your state management or API here
  const bookingId = id?.slice(-5).toUpperCase() || "04820";
  const serviceName = "Home Cleaning";
  const dateString = "12 October 2026";
  const timeString = "10:00 AM";
  const address = "Vijayawada";
  const amount = "₹499";

  return (
    <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center p-4 font-sans bg-transparent">
      <div 
        className={`max-w-md w-full bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-6 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">
            Service Booked Successfully!
          </h1>
          <p className="text-sm text-gray-500">
            Your service has been successfully placed.
          </p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
            {serviceName}
          </h2>
          
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Booking ID:</span>
              <span className="font-bold text-gray-900">HCX-{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Date:</span>
              <span className="font-bold text-gray-900">{dateString}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Time:</span>
              <span className="font-bold text-gray-900">{timeString}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Address:</span>
              <span className="font-bold text-gray-900 text-right max-w-[150px] truncate">{address}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-y border-gray-200 my-1">
              <span className="text-gray-500 font-medium">Payment:</span>
              <span className="font-bold text-amber-600">Cash</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Amount:</span>
              <span className="font-bold text-gray-900">{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className="font-bold text-green-600">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(customerPath('/bookings'))} 
            className="flex-1 bg-[#152822] text-white font-bold py-3 px-2 rounded-xl hover:bg-[#1a342b] transition-colors active:scale-[0.98] shadow-sm uppercase tracking-wide text-xs sm:text-sm"
          >
            View Booking
          </button>
          <button
            onClick={() => navigate(customerPath('/'))}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98] shadow-sm uppercase tracking-wide text-xs sm:text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}