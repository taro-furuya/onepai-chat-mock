/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,.06)"
      }
    }
  },
  plugins: [],
};
