/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
    extend: {
        fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
        primary: {
            DEFAULT: '#FFEEE2',  // Light cream (primary color)
            light: '#FFF6ED',    // Lighter version (optional)
            dark: '#FFCBA9',     // Darker version for hover (optional)
        },
        secondary: {
            DEFAULT: '#8E56FF',  // Purple (secondary color)
            light: '#B68AFF',    // Lighter version (optional)
            dark: '#6D3BFF',     // Darker version (for active state)
        },
        accent: {
            DEFAULT: '#F2780D',  // Orange (accent or third color)
            light: '#FFA550',    // Lighter orange for hover
            dark: '#CC620A',     // Darker orange for active
        },
        text: {
            DEFAULT: '#1F2937',  // Default text color
            muted: '#6B7280',    // Muted text color for subtitles
        },
        neutral: {
            light: '#FFFFFF',  // White background
            DEFAULT: '#F3F4F6',  // Neutral gray background
            dark: '#1F2937',    // Dark gray background
        },
        },
    },
    },
    plugins: [],
};
