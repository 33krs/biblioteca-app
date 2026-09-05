/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B2430',
        panel: '#212B38',
        wood: '#6B4A34',
        woodDark: '#4E3626',
        paper: '#F1E9D8',
        brass: '#C9A45C',
        moss: '#4F6650',
        oxblood: '#7A3B3B',
        muted: '#9C9484',
        border: '#3A4452',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        label: ['"Space Grotesk"', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
};
