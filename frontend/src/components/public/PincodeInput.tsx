import React from "react";

interface PincodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const PincodeInput: React.FC<PincodeInputProps> = ({
  value,
  onChange,
  error,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="w-full">
      <label
        htmlFor="pincode"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Pincode
      </label>

      <input
        id="pincode"
        name="pincode"
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={handleChange}
        placeholder="Enter 6-digit pincode"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "pincode-error" : undefined}
        className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
          error
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:border-[#4338ca] focus:ring-indigo-100"
        }`}
      />

      {error && (
        <p
          id="pincode-error"
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default PincodeInput;