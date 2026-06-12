import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#eaf2ff',
          500: '#2563eb',
          700: '#1e40af'
        },
        accent: {
          50: '#f0fdf4',
          500: '#059669',
          700: '#065f46'
        }
      },
      boxShadow: {
        'soft': '0 6px 18px rgba(8,25,40,0.06)',
        'md-strong': '0 8px 30px rgba(8,25,40,0.08)'
      },
    },
  },
  plugins: [],
}

export default config