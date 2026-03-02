/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f5f5f7",
        "surface-elevated": "#ffffff",
        "border-subtle": "#e0e0e6",
        accent: "#2563eb",
        "accent-soft": "#e0edff",
        "text-main": "#111827",
        "text-muted": "#6b7280"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

