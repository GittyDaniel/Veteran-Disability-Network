export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{astro,js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Atkinson Hyperlegible", "system-ui", "sans-serif"],
        heading: ["Merriweather", "Georgia", "serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        border: "var(--color-border)",
      },
    },
  },
};
