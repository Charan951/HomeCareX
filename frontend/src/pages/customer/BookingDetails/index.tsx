import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method");

  const isCOD = method === "cod";

  // Note: Replace these mock values with your actual data context
  const bookingId = id?.slice(-5).toUpperCase() || "2047D7";
  const totalAmount = "₹1528";
  const dateString = "October 5, 2026";
  const timeString = "4:00 PM – 6:00 PM";
  const serviceName = "Deep Home Cleaning";
  const address = "14, Road No. 5, Jubilee Hills, Jubilee Hills, Hyderabad, Telangana — 500033";

  return (
    <div className="p-4 md:p-8 font-sans w-full min-h-screen">
      <div className="bg-[#eefcf2] rounded-xl p-8 md:p-12 w-full max-w-6xl mx-auto text-center shadow-sm">
        
        {/* Stars */}
        <div className="flex justify-center items-center gap-2 text-[#c3a372] mb-4">
          <span className="text-lg">★</span>
          <span className="text-xl">★</span>
          <span className="text-2xl">★</span>
          <span className="text-xl">★</span>
          <span className="text-lg">★</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-serif text-[#102a20] mb-6">
          Booking Confirmed
        </h1>

        <p className="text-gray-600 mb-2 text-lg">
          We are pleased to inform you that your reservation request has been received and confirmed.
        </p>
        <p className="text-gray-900 font-bold mb-6 text-lg">
          Your booking is confirmed. Thank You!
        </p>

        {/* Highlighted Payment Notice */}
        <div className="flex justify-center mb-10">
          {isCOD ? (
            <p className="text-gray-900 font-bold text-base">
              Payment: cash on service. Please pay {totalAmount} to the professional after the visit.
            </p>
          ) : (
            <p className="text-green-700 font-bold text-base">
              Payment successful. Your service is fully paid.
            </p>
          )}
        </div>

        {/* Booking Details Section */}
        <div className="text-left max-w-5xl mx-auto mt-4">
          <h2 className="text-2xl font-serif text-[#102a20] mb-6">Booking Details</h2>

          {/* Grid reverted to 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-gray-200 pb-8 mb-6">
            <div className="md:border-r md:border-dashed md:border-gray-300 pr-2">
              <p className="text-sm text-gray-500 mb-2">Booking:</p>
              <p className="font-extrabold text-gray-900 text-lg">{bookingId}</p>
            </div>
            
            <div className="md:border-r md:border-dashed md:border-gray-300 pr-2">
              <p className="text-sm text-gray-500 mb-1">Date & Time:</p>
              <p className="font-extrabold text-gray-900">{dateString}</p>
              <p className="text-xs text-gray-500 mt-1">{timeString}</p>
            </div>
            
            <div className="md:border-r md:border-dashed md:border-gray-300 pr-2">
              <p className="text-sm text-gray-500 mb-2">Total:</p>
              <p className="font-extrabold text-gray-900 text-lg">{totalAmount}</p>
            </div>
            
            <div className="pr-2">
              <p className="text-sm text-gray-500 mb-2">Status:</p>
              <p className="font-extrabold text-gray-900 text-lg">Confirmed</p>
            </div>
          </div>

          {/* Details Line */}
          <div className="mb-3 text-sm md:text-base">
            <p className="text-gray-600">
              <span className="font-bold text-gray-900">Details:</span>{" "}
              <span className="text-[#c3a372] font-semibold">{serviceName}</span> | {address}
            </p>
          </div>

          {/* Payment Status added below Booking Details */}
          <div className="mb-10 text-sm md:text-base">
            <p className="text-gray-600">
              <span className="font-bold text-gray-900">Payment Status:</span>{" "}
              <span className={`font-semibold ${isCOD ? 'text-amber-600' : 'text-green-600'}`}>
                {isCOD ? 'Pending (Cash on Service)' : 'Paid Successfully'}
              </span>
            </p>
          </div>

          {/* Action Links */}
          <div className="flex gap-6">
            <button
              onClick={() => navigate(customerPath(`/bookings/${id}`))}
              className="text-gray-600 hover:text-black underline font-medium underline-offset-4 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate(customerPath('/'))}
              className="text-gray-600 hover:text-black underline font-medium underline-offset-4 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}