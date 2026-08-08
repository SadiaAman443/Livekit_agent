/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1d4ed8", // primary blue matching CRM
          foreground: "#ffffff",
        },
        background: "#f8fafc", // very light gray/blue background
        surface: "#ffffff", // card backgrounds
        muted: "#f1f5f9", 
        "muted-foreground": "#64748b",
        border: "#e2e8f0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
