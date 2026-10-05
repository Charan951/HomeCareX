import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import PincodeInput from "./PincodeInput";

const searchSchema = z.object({
  service: z.string().trim().min(1, "Please enter a service"),

  pincode: z
    .string()
    .trim()
    .regex(
      /^[1-9][0-9]{5}$/,
      "Please enter a valid 6-digit pincode"
    ),
});

const HeroSearch: React.FC = () => {
  const navigate = useNavigate();

  const [service, setService] = useState("");
  const [pincode, setPincode] = useState("");

  const [errors, setErrors] = useState<{
    service?: string;
    pincode?: string;
  }>({});

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = searchSchema.safeParse({
      service: service.trim(),
      pincode: pincode.trim(),
    });

    // Validation failed
    if (!result.success) {
      const fieldErrors: {
        service?: string;
        pincode?: string;
      } = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (field === "service") {
          fieldErrors.service = issue.message;
        }

        if (field === "pincode") {
          fieldErrors.pincode = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    // Validation successful
    setErrors({});

    const queryParams = new URLSearchParams({
      q: result.data.service,
      pincode: result.data.pincode,
    });

    navigate(`/services?${queryParams.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4">

        {/* ================= SERVICE ================= */}
        <div className="w-full">
          <label
            htmlFor="service-search"
            className="mb-2 block text-sm font-medium text-[#17125f]"
          >
            What service do you need?
          </label>

          <input
            id="service-search"
            name="service"
            type="text"
            value={service}
            onChange={(event) => {
              setService(event.target.value);

              if (errors.service) {
                setErrors((previous) => ({
                  ...previous,
                  service: undefined,
                }));
              }
            }}
            placeholder="Search for a service"
            aria-invalid={Boolean(errors.service)}
            aria-describedby={
              errors.service
                ? "service-error"
                : undefined
            }
            className={`h-12 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:ring-2 ${
              errors.service
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-[#4338ca] focus:ring-indigo-100"
            }`}
          />

          {errors.service && (
            <p
              id="service-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.service}
            </p>
          )}
        </div>

        {/* ================= PINCODE + SEARCH ================= */}
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">

          {/* Pincode */}
          <div className="min-w-0">
            <PincodeInput
              value={pincode}
              onChange={(value) => {
                setPincode(value);

                if (errors.pincode) {
                  setErrors((previous) => ({
                    ...previous,
                    pincode: undefined,
                  }));
                }
              }}
              error={errors.pincode}
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="h-12 rounded-lg bg-[#4338ca] px-6 font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff8a3d] focus:outline-none focus:ring-2 focus:ring-[#4338ca] focus:ring-offset-2"
          >
            Search
          </button>

        </div>
      </div>
    </form>
  );
};

export default HeroSearch;