import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0D0D0E",
        charcoal: "#161618",
        gold: "#D4AF37",
        champagne: "#F1E5AC",
        platinum: "#94A3B8"
      },
      boxShadow: {
        "gold-soft": "0 0 34px rgba(212, 175, 55, 0.16)"
      },
      textWrap: {
        balance: "balance",
        pretty: "pretty"
      }
    }
  },
  plugins: []
} satisfies Config;

