/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Color Primario Corporativo Apolena: Naranja Vibrante (#FD9414)
        primary: {
          DEFAULT: "#FD9414",
          50: "#FFF8ED",
          100: "#FFEFD4",
          200: "#FFDCA8",
          300: "#FFC270",
          400: "#FEAB38",
          500: "#FD9414",
          600: "#E07B06",
          700: "#B95D07",
          800: "#94490C",
          900: "#7A3D0F",
        },
        // Color Secundario Corporativo Apolena: Azul Marino (#102854)
        secondary: {
          DEFAULT: "#102854",
          50: "#E6EDF5",
          100: "#C5D6EA",
          200: "#9BB8DB",
          300: "#6B96C9",
          400: "#3E6FA8",
          500: "#1D438A",
          600: "#15346E",
          700: "#102854",
          800: "#0B1D3E",
          900: "#071329",
        },
        // Fondos Arena Suave y Blanco Lienzo del Manual de Marca
        cream: {
          50: "#FCFDFA",
          100: "#F7F2EB",
          200: "#E6EDF5",
          300: "#D5DFEC",
        },
        // Alias semánticos para que todas las vistas hereden el tema corporativo
        terracotta: {
          DEFAULT: "#FD9414",
          50: "#FFF8ED",
          100: "#FFEFD4",
          200: "#FFDCA8",
          500: "#FD9414",
          600: "#E07B06",
          700: "#B95D07",
          800: "#94490C",
        },
        stone: {
          50: "#FCFDFA",
          100: "#F7F2EB",
          200: "#E6EDF5",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#1D3B70",
          800: "#15305E",
          900: "#102854",
        },
        sage: {
          50: "#EEF4F0",
          100: "#D9E8DF",
          600: "#3B6E52",
          700: "#2D553F",
        },
      },
      boxShadow: {
        soft: "0 2px 16px -2px rgba(16, 40, 84, 0.06), 0 1px 4px -1px rgba(16, 40, 84, 0.04)",
        card: "0 8px 30px -4px rgba(16, 40, 84, 0.08)",
      },
    },
  },
  plugins: [],
};
