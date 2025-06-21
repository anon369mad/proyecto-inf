/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        "boton-home": "#12DB7B",
        "enviar" : "#43B343",
        "borrar" : "#C74747",
        "pendiente" : "#ECC652",
        "apelar" :"#5286EC"
      }
    },
  },
  plugins: [require('daisyui'),],
  daisyui: {
    themes: false,
    darkTheme: "light", // Desactiva los temas por defecto
    base: false
  },
}
