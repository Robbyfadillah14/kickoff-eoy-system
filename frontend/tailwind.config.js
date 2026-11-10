/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    // TAMBAHKAN PATH INI SESUAI STRUKTUR FOLDER LO:
    "./frontend/components/**/*.{js,jsx,ts,tsx}",
    "./frontend/app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1220",
        bg2: "#0f1a2e",
        card: "#121e33",
        line: "#223353",
        sub: "#8fa2c4",
        accent: "#f5a524",
        run: "#4f8cff",
        grow: "#3ecf8e",
        transform: "#f5a524",
      },
    },
  },
  plugins: [],
};