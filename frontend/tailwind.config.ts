import { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        mauve: '#C8AAAA', // Custom color added
        light_peach: '#FFDAB3',
      },
    },
  },
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}', // Update according to your project structure
  ],
  plugins: [],
}

export default config
