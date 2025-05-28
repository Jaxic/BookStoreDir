/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#3A4BA0', // Indigo Blue
        secondary: '#F6E7D8', // Soft Sand
        accent: '#E76F51', // Coral Red
        text: '#232323', // Charcoal
        background: '#FFFDF6', // Ivory
      },
      backgroundColor: theme => ({
        ...theme('colors'),
        primary: '#3A4BA0',
        secondary: '#F6E7D8',
        accent: '#E76F51',
        background: '#FFFDF6',
      }),
      textColor: theme => ({
        ...theme('colors'),
        primary: '#3A4BA0',
        secondary: '#F6E7D8',
        accent: '#E76F51',
        text: '#232323',
        background: '#FFFDF6',
      }),
    },
  },
  plugins: [],
}; 