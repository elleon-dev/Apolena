/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "#FAF8F5",
          100: "#F3EFEA",
          200: "#E8E2D9",
          300: "#D6CEC2",
        },
        terracotta: {
          50: "#FCF3F0",
          100: "#F7E1D9",
          500: "#C85A32",
          600: "#B04A25",
          700: "#8F3A1B",
        },
        sage: {
          50: "#EEF4F0",
          100: "#D9E8DF",
          600: "#3B6E52",
          700: "#2D553F",
        },
      },
      boxShadow: {
        soft: "0 2px 16px -2px rgba(28, 25, 23, 0.05), 0 1px 4px -1px rgba(28, 25, 23, 0.03)",
        card: "0 8px 30px -4px rgba(28, 25, 23, 0.06)",
      },
    },
  },
  plugins: [],
};
