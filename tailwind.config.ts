import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		fontFamily: {
			'sans': ['Inter', 'system-ui', 'sans-serif'],
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				// Updated Diffused branding colors - Sky Blue theme
				background: '#FFFFFF',
				foreground: 'hsl(var(--foreground))',
				primary: '#5B9BD5', // Sky Blue - main brand color
				primaryDark: '#4A8BC2', // Darker sky blue
				accent: '#87CEEB', // Light sky blue accent
				accentLight: '#F0F8FF', // Very light blue
				blue: '#5B9BD5', // Primary sky blue
				blueLight: '#E6F3FF', // Light blue background
				card: '#FFFFFF', // White cards
				cardAlt: '#F8FAFE', // Very light blue card alternative
				text: '#1F2937', // Dark grey/black text
				textSecondary: '#6B7280', // Silver/grey secondary text
				silver: '#C0C0C0', // Silver color
				lightGrey: '#F3F4F6', // Light grey backgrounds
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: '1.5rem',
				md: '1rem',
				sm: '0.5rem'
			},
			boxShadow: {
				card: '0 2px 8px -2px rgba(91, 155, 213, 0.15), 0 4px 16px -4px rgba(91, 155, 213, 0.10)',
				'card-hover': '0 4px 16px -2px rgba(91, 155, 213, 0.20), 0 8px 24px -4px rgba(91, 155, 213, 0.15)',
				button: '0 1px 3px 0 rgba(91, 155, 213, 0.12), 0 1px 2px 0 rgba(91, 155, 213, 0.08)',
				'button-hover': '0 2px 6px -1px rgba(91, 155, 213, 0.15), 0 4px 12px -2px rgba(91, 155, 213, 0.12)',
				sidebar: '2px 0 8px -2px rgba(0, 0, 0, 0.10)',
				dropdown: '0 4px 16px -2px rgba(0, 0, 0, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.10)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
