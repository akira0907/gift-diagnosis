import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ブランドカラー（ギフトらしい暖かみのある配色）
        primary: {
          50: "#fdf4f3",
          100: "#fce8e6",
          200: "#f9d4d0",
          300: "#f4b4ae",
          400: "#ec8b82",
          500: "#e0655a",
          600: "#cb4539",
          700: "#aa372d",
          800: "#8d3129",
          900: "#762e28",
          950: "#401511",
        },
        secondary: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b1bac8",
          400: "#8795a9",
          500: "#68778f",
          600: "#536076",
          700: "#444e60",
          800: "#3b4351",
          900: "#343a46",
          950: "#23272f",
        },
      },
      fontFamily: {
        sans: [
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
