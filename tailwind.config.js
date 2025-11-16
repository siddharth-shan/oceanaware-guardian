/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Ocean Blues (replaces fire colors)
        ocean: {
          50: '#f0f9ff',   // Lightest sky
          100: '#e0f2fe',  // Light sky blue
          200: '#bae6fd',  // Sky blue
          300: '#7dd3fc',  // Light ocean
          400: '#38bdf8',  // Medium ocean
          500: '#0ea5e9',  // Ocean blue
          600: '#0077B6',  // Deep ocean (brand color)
          700: '#023E8A',  // Navy blue
          800: '#03045E',  // Dark navy
          900: '#001845',  // Deepest ocean
        },
        // Coral & Marine Life
        coral: {
          50: '#fff1f2',   // Lightest pink
          100: '#ffe4e6',  // Light coral
          200: '#fecdd3',  // Pink coral
          300: '#fda4af',  // Medium coral
          400: '#fb7185',  // Coral pink
          500: '#FF6B9D',  // Healthy coral (brand)
          600: '#e11d48',  // Deep coral
          700: '#be123c',  // Dark coral
          800: '#9f1239',  // Darker coral
          900: '#E8E8E8',  // Bleached coral (warning)
        },
        // Kelp & Seaweed Greens
        kelp: {
          50: '#f0fdf4',   // Lightest green
          100: '#dcfce7',  // Light green
          200: '#bbf7d0',  // Pale kelp
          300: '#86efac',  // Light kelp
          400: '#4ade80',  // Medium kelp
          500: '#2D6A4F',  // Kelp green (brand)
          600: '#16a34a',  // Deep kelp
          700: '#15803d',  // Forest green
          800: '#166534',  // Dark forest
          900: '#14532d',  // Deepest green
        },
        // Sand & Beach
        sand: {
          50: '#fefce8',   // Lightest sand
          100: '#fef9c3',  // Light sand
          200: '#fef08a',  // Pale sand
          300: '#fde047',  // Yellow sand
          400: '#facc15',  // Golden sand
          500: '#eab308',  // Beach sand
          600: '#ca8a04',  // Dark sand
          700: '#a16207',  // Brown sand
          800: '#854d0e',  // Deep sand
          900: '#713f12',  // Darkest sand
        },
        // Ocean Foam & Waves
        foam: {
          50: '#ecfeff',   // Lightest foam
          100: '#cffafe',  // Light foam
          200: '#a5f3fc',  // Pale foam
          300: '#67e8f9',  // Light wave
          400: '#22d3ee',  // Medium foam
          500: '#90E0EF',  // Ocean foam (brand)
          600: '#0891b2',  // Deep foam
          700: '#0e7490',  // Dark foam
          800: '#155e75',  // Darker foam
          900: '#164e63',  // Deepest foam
        },
        // Warnings & Alerts (Tsunami, Storm Surge)
        warning: {
          50: '#fff7ed',   // Lightest warning
          100: '#ffedd5',  // Light warning
          200: '#fed7aa',  // Pale warning
          300: '#fdba74',  // Light orange
          400: '#fb923c',  // Medium warning
          500: '#F77F00',  // Warning orange (brand)
          600: '#ea580c',  // Deep warning
          700: '#c2410c',  // Dark warning
          800: '#9a3412',  // Darker warning
          900: '#7c2d12',  // Deepest warning
        },
        // Critical Alerts (Evacuation, Emergency)
        critical: {
          50: '#fef2f2',   // Lightest critical
          100: '#fee2e2',  // Light critical
          200: '#fecaca',  // Pale critical
          300: '#fca5a5',  // Light red
          400: '#f87171',  // Medium critical
          500: '#D62828',  // Critical red (brand)
          600: '#dc2626',  // Deep critical
          700: '#b91c1c',  // Dark critical
          800: '#991b1b',  // Darker critical
          900: '#7f1d1d',  // Deepest critical
        },
      },
      animation: {
        // Existing animations
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',

        // Ocean-themed animations
        'wave': 'wave 3s ease-in-out infinite',
        'wave-slow': 'wave 5s ease-in-out infinite',
        'current': 'current 4s linear infinite',
        'bubble': 'bubble 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'ripple': 'ripple 1s ease-out',
        'tide': 'tide 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        // Existing keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },

        // Ocean-themed keyframes
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        current: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(1.2)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(2deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-2deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        tide: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      }
    },
  },
  plugins: [],
}