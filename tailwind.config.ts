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
					dark: '#003D52',
				},
				// QiewCode colors
				qc: {
					green: {
						DEFAULT: '#0b3b2e',
						2: '#104b3a',
					},
					gold: {
						DEFAULT: '#d4a517',
						2: '#e6b93c',
					},
				},
				admin: {
					bg: {
						DEFAULT: '#040f0c',
						soft: '#071912',
						card: 'rgba(12, 36, 27, 0.98)',
					},
					nav: 'rgba(4, 15, 12, 0.98)',
					border: 'rgba(255, 255, 255, 0.08)',
					text: {
						DEFAULT: '#f9fafb',
						soft: '#cbd5e1',
					}
				}
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
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"dropdown": "dropdownOpen 0.2s ease-out forwards",
				"fadeIn": "fadeIn 0.3s ease-out forwards",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}

export default config