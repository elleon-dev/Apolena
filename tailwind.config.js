/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Color Primario Corporativo Apolena: Verde Bosque (#174B3D)
        primary: {
          DEFAULT: "#174B3D",
          50: "#F0F6F4",
          100: "#DCEAE5",
          200: "#B8D5CB",
          300: "#8FBBB0",
          400: "#609B8E",
          500: "#174B3D",
          600: "#134034",
          700: "#0F3229",
          800: "#0A241D",
          900: "#061713",
        },
        // Color Secundario Corporativo Apolena: Salmón (#E9A17B)
        secondary: {
          DEFAULT: "#E9A17B",
          50: "#FDFAF8",
          100: "#FAF0EB",
          200: "#F5DFD5",
          300: "#F0CEBF",
          400: "#EDB89D",
          500: "#E9A17B",
          600: "#D98A60",
          700: "#B86E47",
          800: "#8F5232",
          900: "#693A21",
        },
        // Fondos Marfil y Arena del Manual de Marca
        cream: {
          50: "#F5EDE0",
          100: "#EFE7DA",
          200: "#E6DDCF",
          300: "#D4C5B3",
        },
        // Alias semánticos mapeados a la nueva paleta oficial
        terracotta: {
          DEFAULT: "#E9A17B",
          50: "#FDFAF8",
          100: "#FAF0EB",
          200: "#F5DFD5",
          500: "#E9A17B",
          600: "#D98A60",
          700: "#B86E47",
          800: "#8F5232",
        },
        stone: {
          50: "#F5EDE0",
          100: "#EFE7DA",
          200: "#E6DDCF",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#4A6B60",
          600: "#3B574E",
          700: "#174B3D",
          800: "#123C31",
          900: "#0C2922",
        },
        sage: {
          50: "#F0F6F4",
          100: "#DCEAE5",
          600: "#4A6B60",
          700: "#174B3D",
        },
      },
      boxShadow: {
        soft: "0 2px 16px -2px rgba(23, 75, 61, 0.06), 0 1px 4px -1px rgba(23, 75, 61, 0.04)",
        card: "0 8px 30px -4px rgba(23, 75, 61, 0.08)",
      },
    },
  },
  plugins: [],
};