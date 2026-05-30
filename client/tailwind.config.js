/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Streetwear Palette (Grayscale + Muted Accent)
        background: '#ffffff',
        surface: '#f5f5f5',
        'surface-dim': '#eeeeee',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fafafa',
        'surface-container': '#f5f5f5',
        'surface-container-high': '#e5e5e5',
        'surface-container-highest': '#d4d4d4',
        'on-surface': '#000000',
        'on-surface-variant': '#404040',
        'inverse-surface': '#000000',
        'inverse-on-surface': '#ffffff',
        outline: '#cccccc',
        'outline-variant': '#e0e0e0',
        
        // Brand/Accent Colors
        primary: '#000000',
        'on-primary': '#ffffff',
        secondary: '#8B0000', // Muted dark red accent
        'on-secondary': '#ffffff',
        
        // Status Colors
        error: '#8B0000',
        'on-error': '#ffffff',
        
        // Custom Street Colors
        'street-black': '#050505',
        'street-white': '#FAFAFA',
        'street-grey': '#A3A3A3',
      },
      spacing: {
        'margin-safe': '32px',
        gutter: '24px',
        unit: '4px',
        'stack-tight': '12px',
        'stack-loose': '64px',
      },
      fontFamily: {
        anton: ['"Anton"', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%)',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}
