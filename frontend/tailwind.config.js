/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAFC",
        panel: "#FFFFFF",
        line: "#E4E4EF",
        ink: "#1E1B2E",
        muted: "#6B6880",
        // Brand palette from the HomeCareX logo/brand guide
        brand: "#4338CA",       // indigo — primary actions, active nav, links
        "brand-soft": "#EEECFB",
        accent: "#FF8A3D",      // orange — highlights, badges, secondary emphasis
        "accent-soft": "#FFEADB",
        danger: "#DC2626",
        "danger-soft": "#FDE8E8",
      },
      fontFamily: {
        sans: ["'Poppins'", "system-ui", "sans-serif"], // per brand guide typography
      },
      borderRadius: { DEFAULT: "10px" },
    },
  },
  plugins: [],
};