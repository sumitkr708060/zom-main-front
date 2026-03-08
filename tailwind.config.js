/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    DEFAULT: '#f97316',
                },
                secondary: { DEFAULT: '#1e293b', dark: '#0f172a' },
                accent: '#3b82f6',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
            },
            fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'bounce-sm': 'bounceSm 1s infinite',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
                slideDown: { '0%': { transform: 'translateY(-10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
                bounceSm: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
            },
            boxShadow: {
                card: '0 2px 12px rgba(0,0,0,0.08)',
                'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
                sticky: '0 2px 20px rgba(0,0,0,0.1)',
            },
            screens: { xs: '375px' },
        },
    },
    plugins: [],
};
