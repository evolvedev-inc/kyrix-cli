export const configContent = `
import { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '!./src/server/**/*'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

`;
