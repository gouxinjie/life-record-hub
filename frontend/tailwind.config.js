/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00B42A',
                    dark: '#00891E',
                    light: '#E8F7EF',
                }
            }
        },
    },
    plugins: [],
}
