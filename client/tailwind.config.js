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
          50:  '#eef5f8',
          100: '#d3e6ed',
          200: '#a7cddb',
          300: '#7bb4c9',
          400: '#3f8ba8',
          500: '#1B6187',
          600: '#185777',
          700: '#0F3D54',
          800: '#0b2e40',
          900: '#081f2b',
        },
        fit: {
          green: '#1B8A5A',
          amber: '#C98A1F',
          red: '#B3151B',
        },
        underrated: '#B8860B',
      },
    },
  },
  plugins: [],
}
