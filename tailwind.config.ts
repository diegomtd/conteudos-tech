import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050D14',
        card:       '#0A1E30',
        accent:     '#00B4D8',
        'accent-dark': '#0077A8',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
