import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#F5F7FA",
            primary: {
              50: "#E6EEF4",
              100: "#CCDDE9",
              200: "#99BBD3",
              300: "#6699BD",
              400: "#3377A7",
              500: "#0A3D62",
              600: "#08314E",
              700: "#06253B",
              800: "#041A27",
              900: "#020D14",
              DEFAULT: "#0A3D62",
              foreground: "#FFFFFF"
            },
            secondary: {
              50: "#F8F9FA",
              100: "#E9ECEF",
              200: "#DEE2E6",
              300: "#CED4DA",
              400: "#ADB5BD",
              500: "#6C757D",
              600: "#495057",
              700: "#343A40",
              800: "#212529",
              900: "#121416",
              DEFAULT: "#6C757D",
              foreground: "#FFFFFF"
            },
            warning: {
              50: "#FFF8E1",
              100: "#FFECB3",
              200: "#FFE082",
              300: "#FFD54F",
              400: "#FFCA28",
              500: "#FFC107",
              600: "#FFB300",
              700: "#FFA000",
              800: "#FF8F00",
              900: "#FF6F00",
              DEFAULT: "#FFC107",
              foreground: "#000000"
            },
            success: {
              50: "#E8F5E9",
              100: "#C8E6C9",
              200: "#A5D6A7",
              300: "#81C784",
              400: "#66BB6A",
              500: "#28A745",
              600: "#43A047",
              700: "#388E3C",
              800: "#2E7D32",
              900: "#1B5E20",
              DEFAULT: "#28A745",
              foreground: "#FFFFFF"
            },
            danger: {
              50: "#FCE4E4",
              100: "#FABABA",
              200: "#F79090",
              300: "#F46666",
              400: "#F13C3C",
              500: "#DC3545",
              600: "#C82333",
              700: "#BD2130",
              800: "#B21F2D",
              900: "#A71D2A",
              DEFAULT: "#DC3545",
              foreground: "#FFFFFF"
            },
          },
        },
      },
    }),
  ],
};