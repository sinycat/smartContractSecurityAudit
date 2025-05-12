import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        'primary': '#2DD4BF',
        'primary-dark': '#14B8A6',
        'primary-light': '#5EEAD4',
        'dark-bg': '#1A1A1A',
        'dark-surface': '#232323',
        'dark-border': '#333333',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'particle1': 'particle1 4s ease-in-out infinite',
        'particle2': 'particle2 5s ease-in-out infinite',
        'particle3': 'particle3 4.5s ease-in-out infinite',
        'spin': 'spin 3s linear infinite',
        'reverse': 'reverse 3s linear infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        particle1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10px, 10px) scale(1.2)' },
          '50%': { transform: 'translate(5px, 20px) scale(0.8)' },
          '75%': { transform: 'translate(-5px, 10px) scale(1.1)' },
        },
        particle2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(-15px, -5px) scale(0.8)' },
          '50%': { transform: 'translate(-10px, 10px) scale(1.2)' },
          '75%': { transform: 'translate(-5px, -15px) scale(0.9)' },
        },
        particle3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10px, -10px) scale(0.9)' },
          '50%': { transform: 'translate(15px, 5px) scale(1.1)' },
          '75%': { transform: 'translate(5px, -5px) scale(0.8)' },
        },
        reverse: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 100% 100%, rgba(45, 212, 191, 0.15) 0, transparent 50%), radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0, transparent 50%)',
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;
