import type { Config } from 'tailwindcss'

const config: Config = {
	darkMode: ["class"],
	content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}", "*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				sidebar: {
					DEFAULT: '#00313A',
					dark: '#0a1d15',
				},
				// Brand Colors
				brand: {
					green: '#00B512',
					gold: '#D4AF37',
					goldHover: '#C9A530',
					dark: '#040f0c',
					teal: '#17624b',
				},
				// Dark Mode Theme
				darkBg: {
					main: '#040f0c',
					card: 'rgba(12, 36, 27, 0.8)',
					interactive: 'rgba(15, 23, 42, 0.35)',
					overlay: 'rgba(15, 23, 42, 0.4)',
					sidebar: 'rgba(4, 15, 12, 0.98)',
				},
				darkBorder: {
					light: 'rgba(255, 255, 255, 0.05)',
					medium: 'rgba(255, 255, 255, 0.1)',
					hover: 'rgba(255, 255, 255, 0.15)',
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				dropdownOpen: {
					from: {
						opacity: "0",
						transform: "scale(0.95) translateY(-10px)",
					},
					to: {
						opacity: "1",
						transform: "scale(1) translateY(0)",
					},
				},
				fadeIn: {
					from: {
						opacity: "0",
						transform: "translateY(10px)",
					},
					to: {
						opacity: "1",
						transform: "translateY(0)",
					},
				},
				scaleIn: {
					from: {
						opacity: "0",
						transform: "scale(0.8)",
					},
					to: {
						opacity: "1",
						transform: "scale(1)",
					},
				},
				drawCheck: {
					"0%": { strokeDashoffset: "100" },
					"100%": { strokeDashoffset: "0" },
				},
				sparkle: {
					"0%, 100%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
					"50%": { transform: "scale(1) rotate(45deg)", opacity: "1" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-10px)" },
				},
				slideUp: {
					from: { opacity: "0", transform: "translateY(20px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"dropdown": "dropdownOpen 0.2s ease-out forwards",
				"fadeIn": "fadeIn 0.3s ease-out forwards",
				"scaleIn": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
				"drawCheck": "drawCheck 0.6s ease-out forwards 0.2s",
				"sparkle": "sparkle 1.5s ease-in-out infinite",
				"float": "float 3s ease-in-out infinite",
				"slideUp": "slideUp 0.5s ease-out forwards",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}

export default config