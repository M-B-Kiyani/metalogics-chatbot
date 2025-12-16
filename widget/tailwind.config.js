/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Prevent Tailwind from affecting host page styles
  },
};
