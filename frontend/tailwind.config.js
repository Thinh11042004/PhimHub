/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx,js,jsx,html}'
	],
	theme: {
		extend: {
			colors: {
				// PhimHub Brand Colors
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9', // Main primary
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
				},
				secondary: {
					50: '#fefce8',
					100: '#fef9c3',
					200: '#fef08a',
					300: '#fde047',
					400: '#facc15',
					500: '#eab308', // Main secondary
					600: '#ca8a04',
					700: '#a16207',
					800: '#854d0e',
					900: '#713f12',
				},
				accent: {
					50: '#fdf2f8',
					100: '#fce7f3',
					200: '#fbcfe8',
					300: '#f9a8d4',
					400: '#f472b6',
					500: '#ec4899', // Main accent
					600: '#db2777',
					700: '#be185d',
					800: '#9d174d',
					900: '#831843',
				},
				// Dark theme colors
				dark: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#000011', // Main dark
					950: '#020617',
				},
				// Success, Warning, Error
				success: {
					50: '#f0fdf4',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
				},
				warning: {
					50: '#fffbeb',
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
				},
				error: {
					50: '#fef2f2',
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c',
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Poppins', 'system-ui', 'sans-serif'],
				bold: ['Inter', 'system-ui', 'sans-serif'],
			},
			fontWeight: {
				'normal': '400',
				'medium': '500',
				'semibold': '600',
				'bold': '700',
				'extrabold': '800',
				'black': '900',
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
				'gradient-accent': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
				'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
			}
		}
	},
	plugins: []
};
