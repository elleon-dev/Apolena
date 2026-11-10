/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // PRIMARY: #174B3D (Verde Bosque Oficial Apolena)
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
        // SECONDARY: #c6a26c (Dorado Champagne Oficial Apolena)
        secondary: {
          DEFAULT: "#c6a26c",
          50: "#FCF9F3",
          100: "#F7EFE0",
          200: "#EDE0C4",
          300: "#E1CCA0",
          400: "#D4B684",
          500: "#c6a26c",
          600: "#B38D54",
          700: "#94713F",
          800: "#755830",
          900: "#574122",
        },
        // TERTIARY: #FFFBF2 (Fondo Crema / Marfil Oficial Apolena)
        tertiary: {
          DEFAULT: "#FFFBF2",
          50: "#FFFDF9",
          100: "#FFFBF2",
          200: "#F6EFE0",
          300: "#E8DEC8",
        },
        // Fondos Crema mapeados al Tertiary #FFFBF2
        cream: {
          DEFAULT: "#FFFBF2",
          50: "#FFFBF2",
          100: "#FFFBF2",
          200: "#F3EBD9",
          300: "#E4D9C3",
        },
        // Alias semánticos mapeados a la nueva paleta oficial (#c6a26c y #174B3D)
        terracotta: {
          DEFAULT: "#c6a26c",
          50: "#FCF9F3",
          100: "#F7EFE0",
          200: "#EDE0C4",
          500: "#c6a26c",
          600: "#B38D54",
          700: "#94713F",
          800: "#755830",
        },
        stone: {
          50: "#FFFBF2",
          100: "#F6EFE0",
          200: "#E8DEC8",
          300: "#D5C9B0",
          400: "#8A8478",
          500: "#5C5850",
          600: "#3E3C37",
          700: "#174B3D",
          800: "#141414",
          900: "#0A0A0A",
        },
        sage: {
          50: "#F0F6F4",
          100: "#DCEAE5",
          600: "#174B3D",
          700: "#134034",
        },
      },
      boxShadow: {
        soft: "0 2px 16px -2px rgba(23, 75, 61, 0.07), 0 1px 4px -1px rgba(23, 75, 61, 0.04)",
        card: "0 8px 30px -4px rgba(23, 75, 61, 0.10)",
      },
    },
  },
  plugins: [],
};
