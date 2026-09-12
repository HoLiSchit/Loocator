const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './app.js', './src/lib/*.js'],
  theme: {
    extend: {
      fontFamily: {
        // System-Font bleibt für Fließtext/Daten; die Display-Schrift trägt die Marke
        // (Splash, Sidebar-Wordmark, Karma-Ränge) - siehe Design-Kritik P1.
        display: ['"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Eigene Markenfarbe statt geborgtem Google-Maps-Blau (#4285F4): Tailwinds
        // vollständige teal-Skala, deren 600er-Ton (#0d9488) zufällig exakt der
        // Wunschfarbe entspricht - kompletter, geprüfter Shade-Umfang statt
        // handgestrickter Einzelwerte.
        brand: colors.teal,
        // accent = die einzige bereits vorhandene Eigenfarbe der App (#e5316b),
        // jetzt bewusst als Delight-/Karma-/Favoriten-Farbe durchgezogen statt nur
        // an einer Stelle genutzt.
        accent: {
          50: '#fdeef3',
          100: '#fbd6e3',
          200: '#f7aec8',
          300: '#f27fa8',
          400: '#ef5a92',
          500: '#e5316b',
          600: '#c22458',
          700: '#9c1c47',
          800: '#7a1638',
          900: '#5c102a',
        },
        // Filter-/Status-Kategorien als benannte Tokens statt verstreuter Hex-Werte
        // in app.js (PRIO_COLORS) und index.html - eine Quelle der Wahrheit.
        eurokey: { DEFAULT: '#eab308', 500: '#eab308' },
        changing: { DEFAULT: '#a855f7', 500: '#a855f7' },
        free: { DEFAULT: '#16a34a', 600: '#16a34a' },
        defect: { DEFAULT: '#9ca3af', 400: '#9ca3af' },
        // "Hohe Erfolgsrate" nutzte bisher dasselbe Gelb wie "Eurokey" - ein
        // echtes Verwechslungsrisiko (siehe Persona "Sam" in der Design-Kritik).
        success: colors.teal[600],
      },
    },
  },
  plugins: [],
};
